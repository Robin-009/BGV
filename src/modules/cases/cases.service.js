const prisma = require('../../config/database');
const { NotFoundError, ConflictError, ValidationError } = require('../../utils/errors');

// TAT defaults in calendar days per case type
const TAT_DEFAULTS = {
  DRIVER_BGV:    { warning: 3, due: 5  },
  EMBASSY_BGV_1: { warning: 5, due: 7  },
  EMBASSY_BGV_2: { warning: 7, due: 10 },
  CORPORATE_BGV: { warning: 5, due: 7  },
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const generateCaseNumber = async () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');

  const prefix = `TRU-${ts}`;
  const count  = await prisma.bgvCase.count({
    where: { caseNumber: { startsWith: prefix } },
  });
  return `${prefix}-${pad(count + 1)}`;
};

const CASE_SELECT = {
  id:                   true,
  caseNumber:           true,
  clientRefId:          true,
  clientName:           true,
  candidateName:        true,
  caseType:             true,
  status:               true,
  initiationDate:       true,
  tatWarningAt:         true,
  tatDueAt:             true,
  ocrCompletedAt:       true,
  fieldSubmittedAt:     true,
  reportApprovedAt:     true,
  createdAt:            true,
  updatedAt:            true,
  createdBy:            { select: { id: true, name: true, email: true } },
  assignedCoordinator:  { select: { id: true, name: true, email: true } },
  candidateProfile:     { select: { id: true, fullName: true, contactNo: true, email: true } },
  _count:               { select: { files: true, ocrJobs: true } },
  files: {
    select: { metadata: true, fileKind: true },
    where:  { fileKind: { notIn: ['OCR_TEXT', 'STRUCTURED_JSON', 'EXCEL_EXPORT'] } },
    take:   20,
  },
};

const listCases = async ({ tenantId, page, limit, status, caseType, search, fromDate, toDate, pendingMdReview }) => {
  const where = {
    tenantId,
    ...(pendingMdReview && {
      status: 'CREATED',
      files: { some: { docStatus: 'DATA_EXTRACTED' } },
    }),
    ...(!pendingMdReview && status && { status: { in: Array.isArray(status) ? status : [status] } }),
    ...(caseType && { caseType }),
    ...(search   && {
      OR: [
        { caseNumber:   { contains: search, mode: 'insensitive' } },
        { clientRefId:  { contains: search, mode: 'insensitive' } },
        { candidateName:{ contains: search, mode: 'insensitive' } },
        { clientName:   { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...((fromDate || toDate) && {
      createdAt: {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate   && { lte: new Date(toDate)   }),
      },
    }),
  };

  const [total, cases] = await Promise.all([
    prisma.bgvCase.count({ where }),
    prisma.bgvCase.findMany({
      where,
      select:  CASE_SELECT,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  return { cases, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const getCaseById = async (id, tenantId) => {
  const bgvCase = await prisma.bgvCase.findFirst({
    where:  { id, tenantId },
    select: {
      ...CASE_SELECT,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take:    10,
        select:  { id: true, oldStatus: true, newStatus: true, remarks: true, createdAt: true,
                   changedBy: { select: { id: true, name: true } } },
      },
    },
  });
  if (!bgvCase) throw new NotFoundError('Case');
  return bgvCase;
};

const createCase = async ({ tenantId, candidateName, clientRefId, clientName, caseType,
                            initiationDate, assignedCoordinatorId, createdById, tatDueDays }) => {
  if (clientRefId) {
    const exists = await prisma.bgvCase.findFirst({ where: { tenantId, clientRefId } });
    if (exists) throw new ConflictError(`A case with reference ID "${clientRefId}" already exists`);
  }

  if (assignedCoordinatorId) {
    const coord = await prisma.user.findFirst({ where: { id: assignedCoordinatorId, tenantId } });
    if (!coord) throw new NotFoundError('Coordinator');
  }

  const caseNumber = await generateCaseNumber();
  const now        = new Date();
  const tat        = TAT_DEFAULTS[caseType];
  const dueDays    = tatDueDays ?? tat.due;

  const tatDueAt     = addDays(now, dueDays);
  const tatWarningAt = addDays(now, dueDays - (tat.due - tat.warning));

  return prisma.bgvCase.create({
    data: {
      tenantId,
      caseNumber,
      clientRefId:          clientRefId  ?? null,
      clientName:           clientName   ?? null,
      candidateName:        candidateName,
      caseType,
      initiationDate:       initiationDate ? new Date(initiationDate) : null,
      status:               'CREATED',
      createdById:          createdById  ?? null,
      assignedCoordinatorId: assignedCoordinatorId ?? null,
      tatDueAt,
      tatWarningAt,
    },
    select: CASE_SELECT,
  });
};

const updateCase = async (id, tenantId, updates) => {
  await getCaseById(id, tenantId);

  if (updates.assignedCoordinatorId) {
    const coord = await prisma.user.findFirst({
      where: { id: updates.assignedCoordinatorId, tenantId },
    });
    if (!coord) throw new NotFoundError('Coordinator');
  }

  if (updates.clientRefId) {
    const conflict = await prisma.bgvCase.findFirst({
      where: { tenantId, clientRefId: updates.clientRefId, NOT: { id } },
    });
    if (conflict) throw new ConflictError(`Reference ID "${updates.clientRefId}" already in use`);
  }

  const data = {};
  if (updates.clientRefId   !== undefined) data.clientRefId   = updates.clientRefId;
  if (updates.clientName    !== undefined) data.clientName    = updates.clientName;
  if (updates.candidateName !== undefined) data.candidateName = updates.candidateName;
  if (updates.caseType      !== undefined) data.caseType      = updates.caseType;
  if (updates.initiationDate !== undefined)
    data.initiationDate = updates.initiationDate ? new Date(updates.initiationDate) : null;
  if (updates.assignedCoordinatorId !== undefined)
    data.assignedCoordinatorId = updates.assignedCoordinatorId;

  return prisma.bgvCase.update({ where: { id }, data, select: CASE_SELECT });
};

const updateCaseStatus = async (id, tenantId, newStatus, remarks, changedById) => {
  const bgvCase = await getCaseById(id, tenantId);
  const oldStatus = bgvCase.status;

  if (oldStatus === newStatus) throw new ValidationError('Case is already in this status');

  const [updated] = await prisma.$transaction([
    prisma.bgvCase.update({
      where: { id },
      data:  { status: newStatus },
      select: CASE_SELECT,
    }),
    prisma.caseStatusHistory.create({
      data: { caseId: id, oldStatus, newStatus, changedById: changedById ?? null, remarks: remarks ?? null },
    }),
  ]);

  return updated;
};

const getCaseFiles = async (id, tenantId) => {
  await getCaseById(id, tenantId);
  return prisma.caseFile.findMany({
    where:   { caseId: id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, fileKind: true, docStatus: true, fileName: true, originalName: true,
      mimeType: true, fileSizeKb: true, filePath: true, storageProvider: true,
      metadata: true,
      createdAt: true, uploadedBy: { select: { id: true, name: true } },
    },
  });
};

const addCaseFile = async ({ caseId, uploadedById, fileKind, filePath, fileName,
                              originalName, mimeType, fileSizeKb }) => {
  return prisma.caseFile.create({
    data: {
      caseId,
      uploadedById: uploadedById ?? null,
      fileKind:     fileKind || 'ORIGINAL_PDF',
      storageProvider: 'LOCAL',
      filePath,
      fileName,
      originalName: originalName ?? null,
      mimeType:     mimeType     ?? null,
      fileSizeKb:   fileSizeKb   ?? null,
    },
    select: {
      id: true, fileKind: true, fileName: true, originalName: true,
      mimeType: true, fileSizeKb: true, filePath: true, storageProvider: true, createdAt: true,
    },
  });
};

const removeCaseFile = async (caseId, fileId, tenantId) => {
  await getCaseById(caseId, tenantId);
  const file = await prisma.caseFile.findFirst({ where: { id: fileId, caseId } });
  if (!file) throw new NotFoundError('File');
  await prisma.caseFile.delete({ where: { id: fileId } });
  return { id: fileId, deleted: true };
};

const updateFileMetadata = async (caseId, fileId, tenantId, metadata) => {
  await getCaseById(caseId, tenantId);
  const file = await prisma.caseFile.findFirst({ where: { id: fileId, caseId } });
  if (!file) throw new NotFoundError('File');

  // Derive docStatus from metadata content
  let docStatus;
  if (metadata?.verifiedByFE === true) {
    const feStatus = (metadata.feVerificationStatus || '').toLowerCase();
    docStatus = feStatus.includes('discrepancy') ? 'DISCREPANCY' : 'FE_VERIFIED';
  } else if (metadata?.ocrFields && Object.keys(metadata.ocrFields).length > 0) {
    docStatus = 'DATA_EXTRACTED';
  }

  const merged = { ...(file.metadata || {}), ...metadata };

  return prisma.caseFile.update({
    where: { id: fileId },
    data:  { metadata: merged, ...(docStatus && { docStatus }) },
    select: { id: true, docStatus: true, metadata: true, createdAt: true },
  });
};

const getComparisonData = async (caseId, tenantId) => {
  const bgvCase = await prisma.bgvCase.findFirst({
    where: { id: caseId, tenantId },
    select: {
      id: true, caseNumber: true, candidateName: true, clientName: true, caseType: true,
      status: true, coordinatorRemarks: true,
      files: {
        select: { id: true, originalName: true, docStatus: true, metadata: true },
        orderBy: { createdAt: 'asc' },
      },
      fieldVisits: {
        select: {
          id: true, visitNumber: true, status: true,
          verificationMode: true, verificationStatus: true,
          groundObservations: true, fieldValues: true,
          notes: true, submittedAt: true,
          fieldAssignment: {
            select: { fieldExec: { select: { id: true, name: true } } },
          },
        },
        orderBy: { submittedAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!bgvCase) throw new NotFoundError('Case');

  const latestVisit = bgvCase.fieldVisits[0] || null;
  return {
    caseId:             bgvCase.id,
    caseNumber:         bgvCase.caseNumber,
    candidateName:      bgvCase.candidateName,
    clientName:         bgvCase.clientName,
    caseType:           bgvCase.caseType,
    coordinatorRemarks: bgvCase.coordinatorRemarks || {},
    files: bgvCase.files.map(f => ({
      id:                  f.id,
      originalName:        f.originalName,
      docStatus:           f.docStatus,
      ocrFields:           f.metadata?.ocrFields            || {},
      docType:             f.metadata?.docType              || null,
      savedAt:             f.metadata?.savedAt              || null,
      verifiedByFE:        f.metadata?.verifiedByFE         || false,
      feVerificationStatus:f.metadata?.feVerificationStatus || null,
      feVerifiedAt:        f.metadata?.feVerifiedAt         || null,
      feExecName:          f.metadata?.feExecName           || null,
      feVerificationMode:  f.metadata?.feVerificationMode   || null,
    })),
    feData: latestVisit ? {
      visitId:           latestVisit.id,
      fieldExecName:     latestVisit.fieldAssignment?.fieldExec?.name || 'Field Executive',
      verificationMode:  latestVisit.verificationMode,
      verificationStatus:latestVisit.verificationStatus,
      groundObservations:latestVisit.groundObservations || {},
      fieldValues:       latestVisit.fieldValues        || {},
      notes:             latestVisit.notes,
      submittedAt:       latestVisit.submittedAt,
    } : null,
  };
};

const buildMdLetterForFile = (bgvCase, file, signedBy, remarks) => {
  const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const docType = file.metadata?.docType || 'Document';
  const ocrFields = file.metadata?.ocrFields || {};

  const rows = Object.entries(ocrFields).map(([k, v], i) => {
    const display = (v !== null && typeof v === 'object') ? JSON.stringify(v) : String(v || '—');
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}"><td style="border:1px solid #e5e7eb;padding:7px 12px;font-weight:600;color:#374151">${k}</td><td style="border:1px solid #e5e7eb;padding:7px 12px;font-weight:700;color:#1d4ed8;font-family:monospace;text-transform:uppercase">${display}</td></tr>`;
  }).join('');

  const remarksRow = remarks
    ? `<p style="font-family:sans-serif;font-size:11px;color:#6b7280;font-style:italic;margin-bottom:14px;padding:8px 12px;background:#f8fafc;border-left:3px solid #a5b4fc;border-radius:2px">Remarks: ${remarks}</p>`
    : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>MD Sign-Off — ${bgvCase.caseNumber} — ${docType}</title></head><body style="font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:0 40px;font-size:13px;line-height:1.7;color:#000">
<div style="display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:14px;margin-bottom:20px">
  <div><div style="font-size:18px;font-weight:700;letter-spacing:0.18em;font-family:sans-serif">TRUDICON</div><div style="font-size:10px;color:#6b7280;font-family:sans-serif">Consultancy Services Pvt. Ltd.</div></div>
  <div style="text-align:right;font-family:sans-serif;font-size:11px"><div style="font-weight:700">Case: ${bgvCase.caseNumber}</div><div style="color:#6b7280;margin-top:2px">Date: ${fmtDate(new Date())}</div></div>
</div>
<p style="font-family:sans-serif;font-size:12px"><strong>To,</strong><br>The Field Executive / Designated Authority,<br>Trudicon Executive Operations.</p>
<div style="font-size:12px;font-weight:700;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding-bottom:8px;margin-bottom:14px;font-family:sans-serif">Subject: MD Sign-Off — ${docType} — ${bgvCase.candidateName} (${bgvCase.clientName})</div>
<p style="font-family:sans-serif;font-size:12px;margin-bottom:14px">This document certifies that the Managing Director has reviewed and signed off the extracted verification data for the <strong>${docType}</strong> submitted for the above candidate. Field Executives are authorised to proceed with physical verification based on the details below.</p>
${remarksRow}
<table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:12px;font-family:sans-serif"><thead><tr style="background:#f5f6fa"><th style="border:1px solid #0f172a;padding:8px 12px;text-align:left;font-weight:700;width:45%">Field / Particulars</th><th style="border:1px solid #0f172a;padding:8px 12px;text-align:left;font-weight:700">Extracted Value</th></tr></thead><tbody>${rows}</tbody></table>
<div style="border-top:1px solid #e5e7eb;padding-top:20px;display:flex;justify-content:space-between;align-items:flex-end;font-family:sans-serif;font-size:11px">
  <div style="color:#6b7280;line-height:1.6"><strong style="color:#0f172a;font-size:12px">Trudicon Consultancy Services Pvt. Ltd.</strong><br>422, 4th Floor, Vipul Trade Centre, Sohna Road,<br>Sector-48, Gurgaon — 122018<br><span style="color:#6366f1;font-weight:600">Case: ${bgvCase.caseNumber}</span></div>
  <div style="text-align:center;width:180px;border:2px solid #6366f1;border-radius:6px;padding:12px">
    <div style="font-family:Georgia,serif;font-size:18px;font-weight:700;font-style:italic">${signedBy}</div>
    <div style="font-size:9px;font-weight:700;color:#6b7280;margin-top:4px;text-transform:uppercase">Managing Director · Trudicon</div>
    <div style="font-size:9px;color:#a5b4fc;margin-top:2px">${fmtDate(new Date())}</div>
  </div>
</div>
</body></html>`;
};

// ── PDF helper using system Chrome via puppeteer-core ─────────────────────────
const htmlToPdf = async (html) => {
  let puppeteer;
  try { puppeteer = require('puppeteer-core'); } catch { return null; }

  const CHROME_PATHS = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  const fs   = require('fs');
  const exec = CHROME_PATHS.find(p => fs.existsSync(p));
  if (!exec) return null;

  const browser = await puppeteer.launch({
    executablePath: exec,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '18mm', right: '18mm', bottom: '18mm', left: '18mm' },
      printBackground: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
};

const mdSignCase = async (caseId, tenantId, { signedBy, remarks }) => {
  const bgvCase = await getCaseById(caseId, tenantId);
  const files   = await prisma.caseFile.findMany({
    where: { caseId, docStatus: 'DATA_EXTRACTED' },
    select: { id: true, metadata: true },
  });

  if (!files.length) throw new Error('No documents with extracted data found for this case.');

  const storage  = require('../../services/storage.service');
  const fs       = require('fs');
  const path     = require('path');
  const signedAt = new Date().toISOString();

  // Use proper md-signoff subdirectory
  const dir = storage.buildCaseDir(caseId, 'MD_SIGNOFF_LETTER');
  storage.ensureDir(dir);

  // Generate one PDF (or HTML fallback) per source document
  const letterFiles = await Promise.all(files.map(async file => {
    const html        = buildMdLetterForFile(bgvCase, file, signedBy, remarks);
    const docTypeSlug = (file.metadata?.docType || 'doc').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);

    const pdfBuf = await htmlToPdf(html).catch(() => null);
    const usePdf = pdfBuf !== null;

    const fileName   = `MD_SignOff_${bgvCase.caseNumber}_${docTypeSlug}_${file.id.slice(0, 8)}.${usePdf ? 'pdf' : 'html'}`;
    const fullPath   = path.join(dir, fileName);

    if (usePdf) {
      fs.writeFileSync(fullPath, pdfBuf);
    } else {
      fs.writeFileSync(fullPath, html, 'utf8');
    }

    return {
      sourceFileId: file.id,
      docType:      file.metadata?.docType || 'Document',
      fileName,
      relativePath: storage.buildRelativePath(caseId, fileName, 'MD_SIGNOFF_LETTER'),
      fileSizeKb:   Math.round((usePdf ? pdfBuf.length : Buffer.byteLength(html, 'utf8')) / 1024) || 1,
      mimeType:     usePdf ? 'application/pdf' : 'text/html',
    };
  }));

  const ops = [
    prisma.bgvCase.update({
      where: { id: caseId },
      data:  { status: 'MD_SIGNED' },
      select: CASE_SELECT,
    }),
    prisma.caseFile.updateMany({
      where: { caseId, docStatus: 'DATA_EXTRACTED' },
      data:  { docStatus: 'MD_SIGNED' },
    }),
    prisma.caseStatusHistory.create({
      data: { caseId, newStatus: 'MD_SIGNED', remarks: remarks || `MD sign-off by ${signedBy}` },
    }),
    // One CaseFile record per signed document
    ...letterFiles.map(lf => prisma.caseFile.create({
      data: {
        caseId,
        fileKind:        'MD_SIGNOFF_LETTER',
        storageProvider: 'LOCAL',
        filePath:        lf.relativePath,
        fileName:        lf.fileName,
        originalName:    `MD Sign-Off — ${lf.docType}`,
        mimeType:        lf.mimeType,
        fileSizeKb:      lf.fileSizeKb,
        metadata:        { signedBy, signedAt, remarks: remarks || null, sourceFileId: lf.sourceFileId, docType: lf.docType },
      },
    })),
  ];

  const [updatedCase] = await prisma.$transaction(ops);
  return updatedCase;
};

const getFullCase = async (id, tenantId) => {
  const bgvCase = await prisma.bgvCase.findFirst({
    where: { id, tenantId },
    select: {
      id: true, caseNumber: true, clientRefId: true, clientName: true,
      candidateName: true, caseType: true, status: true,
      initiationDate: true, tatWarningAt: true, tatDueAt: true,
      ocrCompletedAt: true, fieldSubmittedAt: true, reportApprovedAt: true,
      coordinatorRemarks: true,
      createdAt: true, updatedAt: true,
      createdBy:           { select: { id: true, name: true, email: true } },
      assignedCoordinator: { select: { id: true, name: true, email: true } },
      candidateProfile:    { select: { id: true, fullName: true, contactNo: true, email: true, address: true } },
      _count: { select: { files: true, ocrJobs: true } },
      files: {
        select: {
          id: true, fileKind: true, docStatus: true, fileName: true, originalName: true,
          mimeType: true, fileSizeKb: true, filePath: true, metadata: true,
          createdAt: true, uploadedBy: { select: { id: true, name: true } },
        },
        where:   { fileKind: { notIn: ['OCR_TEXT'] } },
        orderBy: { createdAt: 'asc' },
      },
      fieldAssignments: {
        select: {
          id: true, status: true, remarks: true, assignedAt: true,
          fieldExec: { select: { id: true, name: true, email: true } },
          visits: {
            select: {
              id: true, visitNumber: true, status: true, notes: true,
              verificationMode: true, verificationStatus: true,
              groundObservations: true, fieldValues: true,
              startedAt: true, visitedAt: true, submittedAt: true,
              evidenceFiles: {
                select: {
                  id: true, evidenceType: true, filePath: true, fileName: true,
                  originalName: true, mimeType: true, fileSizeKb: true,
                  notes: true, uploadedAt: true,
                },
                orderBy: { uploadedAt: 'asc' },
              },
            },
            orderBy: { visitNumber: 'asc' },
          },
        },
        orderBy: { assignedAt: 'asc' },
      },
      reports: {
        select: {
          id: true, version: true, status: true, coordinatorRemarks: true,
          managerRemarks: true, qcRemarks: true,
          generatedAt: true, reviewedAt: true, approvedAt: true, finalizedAt: true,
          generatedBy: { select: { id: true, name: true } },
          reviewedBy:  { select: { id: true, name: true } },
          approvedBy:  { select: { id: true, name: true } },
          file:        { select: { id: true, filePath: true, fileName: true, mimeType: true } },
        },
        orderBy: { version: 'desc' },
      },
      statusHistory: {
        select: {
          id: true, oldStatus: true, newStatus: true, remarks: true, createdAt: true,
          changedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });
  if (!bgvCase) throw new NotFoundError('Case');
  return bgvCase;
};

const updateCoordinatorRemarks = async (caseId, tenantId, remarks) => {
  await getCaseById(caseId, tenantId);
  return prisma.bgvCase.update({
    where:  { id: caseId },
    data:   { coordinatorRemarks: remarks },
    select: { id: true, coordinatorRemarks: true, updatedAt: true },
  });
};

module.exports = {
  listCases,
  mdSignCase,
  getCaseById,
  getFullCase,
  createCase,
  updateCase,
  updateCaseStatus,
  getCaseFiles,
  addCaseFile,
  removeCaseFile,
  updateFileMetadata,
  getComparisonData,
  updateCoordinatorRemarks,
};
