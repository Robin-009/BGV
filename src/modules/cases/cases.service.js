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
};

const listCases = async ({ tenantId, page, limit, status, caseType, search, fromDate, toDate }) => {
  const where = {
    tenantId,
    ...(status   && { status: { in: Array.isArray(status) ? status : [status] } }),
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
      id: true, fileKind: true, fileName: true, originalName: true,
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
  return prisma.caseFile.update({
    where: { id: fileId },
    data:  { metadata },
    select: { id: true, metadata: true, createdAt: true },
  });
};

const getComparisonData = async (caseId, tenantId) => {
  const bgvCase = await prisma.bgvCase.findFirst({
    where: { id: caseId, tenantId },
    select: {
      id: true, caseNumber: true, candidateName: true, clientName: true, caseType: true,
      status: true, coordinatorRemarks: true,
      files: {
        select: { id: true, originalName: true, metadata: true },
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
      id:           f.id,
      originalName: f.originalName,
      ocrFields:    f.metadata?.ocrFields || {},
      docType:      f.metadata?.docType   || null,
      savedAt:      f.metadata?.savedAt   || null,
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
  getCaseById,
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
