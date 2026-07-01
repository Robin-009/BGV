const prisma = require('../../config/database');
const { NotFoundError, ValidationError } = require('../../utils/errors');

const ASSIGNMENT_SELECT = {
  id:          true,
  status:      true,
  remarks:     true,
  assignedAt:  true,
  submittedAt: true,
  case: {
    select: {
      id: true, caseNumber: true, candidateName: true, clientName: true,
      clientRefId: true, caseType: true, status: true, tatDueAt: true,
      tatWarningAt: true, createdAt: true,
      assignedCoordinator: { select: { id: true, name: true, email: true } },
      _count: { select: { files: true } },
    },
  },
  fieldExec:  { select: { id: true, name: true, email: true, phone: true, designation: true } },
  assignedBy: { select: { id: true, name: true } },
  visits: {
    select: { id: true, visitNumber: true, status: true, visitedAt: true, submittedAt: true },
    orderBy: { visitNumber: 'desc' },
  },
};

const assertCase = async (caseId, tenantId) => {
  const c = await prisma.bgvCase.findFirst({ where: { id: caseId, tenantId } });
  if (!c) throw new NotFoundError('Case');
  return c;
};

const createAssignment = async (caseId, tenantId, { fieldExecId, assignedById, remarks }) => {
  const bgvCase = await assertCase(caseId, tenantId);

  const exec = await prisma.user.findFirst({
    where: { id: fieldExecId, tenantId, role: 'FIELD_EXECUTIVE', isActive: true },
  });
  if (!exec) throw new NotFoundError('Field executive');

  const [assignment] = await prisma.$transaction([
    prisma.fieldAssignment.create({
      data: {
        caseId,
        fieldExecId,
        assignedById: assignedById ?? null,
        remarks:      remarks     ?? null,
        status:       'ASSIGNED',
      },
      select: ASSIGNMENT_SELECT,
    }),
    prisma.bgvCase.update({
      where: { id: caseId },
      data:  { status: 'FIELD_ASSIGNED' },
    }),
    prisma.caseStatusHistory.create({
      data: {
        caseId,
        oldStatus:   bgvCase.status,
        newStatus:   'FIELD_ASSIGNED',
        changedById: assignedById ?? null,
        remarks:     `Assigned to field executive ${exec.name}`,
      },
    }),
  ]);

  return assignment;
};

const listAssignmentsByCase = async (caseId, tenantId) => {
  await assertCase(caseId, tenantId);
  return prisma.fieldAssignment.findMany({
    where:   { caseId },
    select:  ASSIGNMENT_SELECT,
    orderBy: { assignedAt: 'desc' },
  });
};

const listAssignments = async ({ tenantId, fieldExecId, caseId, status, page, limit } = {}) => {
  page  = Number(page)  || 1;
  limit = Number(limit) || 20;
  const where = {
    case: { tenantId },
    ...(fieldExecId && { fieldExecId }),
    ...(caseId      && { caseId }),
    ...(status      && { status }),
  };

  const [total, assignments] = await Promise.all([
    prisma.fieldAssignment.count({ where }),
    prisma.fieldAssignment.findMany({
      where,
      select:  ASSIGNMENT_SELECT,
      orderBy: { assignedAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  return { assignments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

const updateAssignment = async (id, tenantId, { status, remarks }) => {
  const existing = await prisma.fieldAssignment.findFirst({
    where: { id, case: { tenantId } },
    select: { id: true, status: true, caseId: true },
  });
  if (!existing) throw new NotFoundError('Assignment');
  if (existing.status === status) throw new ValidationError('Assignment is already in this status');

  const data = { status };
  if (status === 'SUBMITTED') data.submittedAt = new Date();
  if (remarks !== undefined)  data.remarks = remarks;

  return prisma.fieldAssignment.update({ where: { id }, data, select: ASSIGNMENT_SELECT });
};

module.exports = { createAssignment, listAssignmentsByCase, listAssignments, updateAssignment };
