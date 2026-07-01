const prisma = require('../../config/database');
const { NotFoundError, ValidationError, ConflictError } = require('../../utils/errors');

const REPORT_SELECT = {
  id:                 true,
  version:            true,
  status:             true,
  requiresQc:         true,
  coordinatorRemarks: true,
  managerRemarks:     true,
  qcRemarks:          true,
  generatedAt:        true,
  reviewedAt:         true,
  approvedAt:         true,
  finalizedAt:        true,
  caseId:             true,
  case: {
    select: {
      id:            true,
      caseNumber:    true,
      candidateName: true,
      clientName:    true,
      caseType:      true,
      status:        true,
    },
  },
  generatedBy: { select: { id: true, name: true, email: true } },
  reviewedBy:  { select: { id: true, name: true, email: true } },
  approvedBy:  { select: { id: true, name: true, email: true } },
  qcBy:        { select: { id: true, name: true, email: true } },
  events: {
    select: {
      id:           true,
      eventType:    true,
      fromStatus:   true,
      toStatus:     true,
      remarks:      true,
      createdAt:    true,
      performedBy:  { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
};

async function resolveCase(tenantId, caseId) {
  const c = await prisma.bgvCase.findFirst({
    where: { id: caseId, tenantId },
    select: { id: true, status: true, caseNumber: true },
  });
  if (!c) throw new NotFoundError('Case');
  return c;
}

async function resolveReport(tenantId, reportId) {
  const r = await prisma.report.findFirst({
    where: { id: reportId, case: { tenantId } },
    select: { id: true, status: true, caseId: true, version: true },
  });
  if (!r) throw new NotFoundError('Report');
  return r;
}

async function createReport(tenantId, { caseId, coordinatorRemarks, requiresQc = true }) {
  const c = await resolveCase(tenantId, caseId);

  // Supersede any existing DRAFT for this case
  const existing = await prisma.report.findFirst({
    where: { caseId, status: { in: ['DRAFT', 'QC_REJECTED'] } },
    select: { id: true, version: true },
    orderBy: { version: 'desc' },
  });

  const nextVersion = existing ? existing.version + 1 : 1;

  const report = await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.report.update({
        where: { id: existing.id },
        data:  { status: 'SUPERSEDED' },
      });
    }

    const r = await tx.report.create({
      data: {
        caseId,
        version:            nextVersion,
        status:             'DRAFT',
        requiresQc,
        coordinatorRemarks: coordinatorRemarks || null,
      },
      select: REPORT_SELECT,
    });

    await tx.reportEvent.create({
      data: {
        reportId:  r.id,
        caseId,
        eventType: 'GENERATED',
        toStatus:  'DRAFT',
        remarks:   coordinatorRemarks || null,
      },
    });

    await tx.bgvCase.update({
      where: { id: caseId },
      data:  { status: 'REPORT_DRAFT' },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId,
        oldStatus: c.status,
        newStatus: 'REPORT_DRAFT',
        remarks:   'Report generated',
      },
    });

    return r;
  });

  return report;
}

async function listReports(tenantId, { status, caseId, page, limit } = {}) {
  page  = Number(page)  || 1;
  limit = Number(limit) || 20;
  const where = {
    case: { tenantId },
    ...(status  ? { status: { in: status.split(',') } } : {}),
    ...(caseId  ? { caseId } : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      select: { ...REPORT_SELECT, events: false },
      orderBy: { generatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { rows, total, page, limit };
}

async function getReport(tenantId, reportId) {
  const r = await prisma.report.findFirst({
    where: { id: reportId, case: { tenantId } },
    select: REPORT_SELECT,
  });
  if (!r) throw new NotFoundError('Report');
  return r;
}

async function getLatestReportForCase(tenantId, caseId) {
  await resolveCase(tenantId, caseId);
  const r = await prisma.report.findFirst({
    where:   { caseId, case: { tenantId } },
    select:  REPORT_SELECT,
    orderBy: { version: 'desc' },
  });
  if (!r) throw new NotFoundError('Report');
  return r;
}

async function updateReport(tenantId, reportId, data) {
  await resolveReport(tenantId, reportId);
  return prisma.report.update({
    where:  { id: reportId },
    data:   {
      coordinatorRemarks: data.coordinatorRemarks,
      managerRemarks:     data.managerRemarks,
      qcRemarks:          data.qcRemarks,
    },
    select: REPORT_SELECT,
  });
}

async function submitForQc(tenantId, reportId, { coordinatorRemarks } = {}) {
  const r = await resolveReport(tenantId, reportId);

  if (!['DRAFT', 'QC_REJECTED'].includes(r.status)) {
    throw new ValidationError(`Report status '${r.status}' cannot be submitted for QC`);
  }

  const c = await resolveCase(tenantId, r.caseId);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where:  { id: reportId },
      data:   {
        status:             'QC_PENDING',
        coordinatorRemarks: coordinatorRemarks || undefined,
      },
      select: REPORT_SELECT,
    });

    await tx.reportEvent.create({
      data: {
        reportId,
        caseId:     r.caseId,
        eventType:  'SENT_FOR_QC',
        fromStatus: r.status,
        toStatus:   'QC_PENDING',
        remarks:    coordinatorRemarks || null,
      },
    });

    await tx.bgvCase.update({
      where: { id: r.caseId },
      data:  { status: 'QC_PENDING' },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId:    r.caseId,
        oldStatus: c.status,
        newStatus: 'QC_PENDING',
        remarks:   'Report submitted for QC',
      },
    });

    return updated;
  });
}

async function qcDecision(tenantId, reportId, { verdict, qcRemarks }) {
  const r = await resolveReport(tenantId, reportId);

  if (r.status !== 'QC_PENDING') {
    throw new ValidationError(`Report status '${r.status}' is not QC_PENDING`);
  }

  const c = await resolveCase(tenantId, r.caseId);

  const isApproved      = verdict === 'APPROVED';
  const newReportStatus = isApproved ? 'QC_PASSED' : 'QC_REJECTED';
  const newCaseStatus   = isApproved ? 'REPORT_APPROVED' : 'REPORT_DRAFT';
  const eventType       = isApproved ? 'QC_PASSED' : 'QC_REJECTED';

  return prisma.$transaction(async (tx) => {
    const updated = await tx.report.update({
      where:  { id: reportId },
      data:   {
        status:    newReportStatus,
        qcRemarks,
        ...(isApproved ? { approvedAt: new Date() } : {}),
      },
      select: REPORT_SELECT,
    });

    await tx.reportEvent.create({
      data: {
        reportId,
        caseId:     r.caseId,
        eventType,
        fromStatus: 'QC_PENDING',
        toStatus:   newReportStatus,
        remarks:    qcRemarks,
      },
    });

    await tx.bgvCase.update({
      where: { id: r.caseId },
      data:  { status: newCaseStatus },
    });

    await tx.caseStatusHistory.create({
      data: {
        caseId:    r.caseId,
        oldStatus: c.status,
        newStatus: newCaseStatus,
        remarks:   `QC decision: ${verdict}`,
      },
    });

    return updated;
  });
}

module.exports = {
  createReport,
  listReports,
  getReport,
  getLatestReportForCase,
  updateReport,
  submitForQc,
  qcDecision,
};
