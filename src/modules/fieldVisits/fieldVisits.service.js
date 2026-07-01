const prisma   = require('../../config/database');
const storage  = require('../../services/storage.service');
const { NotFoundError } = require('../../utils/errors');

const VISIT_SELECT = {
  id:                  true,
  visitNumber:         true,
  status:              true,
  gpsLat:              true,
  gpsLng:              true,
  gpsAccuracyMeters:   true,
  notes:               true,
  verificationMode:    true,
  verificationStatus:  true,
  groundObservations:  true,
  fieldValues:         true,
  startedAt:           true,
  visitedAt:           true,
  submittedAt:         true,
  caseId:              true,
  fieldAssignmentId:   true,
  fieldAssignment: {
    select: {
      id:     true,
      status: true,
      fieldExec: { select: { id: true, name: true, email: true } },
      case: {
        select: {
          id:            true,
          caseNumber:    true,
          candidateName: true,
          clientName:    true,
          caseType:      true,
          status:        true,
          tatDueAt:      true,
        },
      },
    },
  },
  evidenceFiles: {
    select: {
      id:          true,
      evidenceType:true,
      filePath:    true,
      fileName:    true,
      originalName:true,
      mimeType:    true,
      fileSizeKb:  true,
      gpsLat:      true,
      gpsLng:      true,
      notes:       true,
      uploadedAt:  true,
    },
    orderBy: { uploadedAt: 'desc' },
  },
};

const EVIDENCE_SELECT = {
  id:          true,
  evidenceType:true,
  filePath:    true,
  fileName:    true,
  originalName:true,
  mimeType:    true,
  fileSizeKb:  true,
  gpsLat:      true,
  gpsLng:      true,
  notes:       true,
  uploadedAt:  true,
};

const assertAssignment = async (assignmentId, tenantId) => {
  const a = await prisma.fieldAssignment.findFirst({
    where:  { id: assignmentId, case: { tenantId } },
    select: { id: true, caseId: true, status: true, fieldExecId: true },
  });
  if (!a) throw new NotFoundError('Field assignment');
  return a;
};

const assertVisit = async (id, tenantId) => {
  const v = await prisma.fieldVisit.findFirst({
    where:  { id, case: { tenantId } },
    select: { id: true, caseId: true, fieldAssignmentId: true, status: true, visitNumber: true },
  });
  if (!v) throw new NotFoundError('Field visit');
  return v;
};

const createVisit = async (assignmentId, tenantId, data) => {
  const assignment = await assertAssignment(assignmentId, tenantId);

  const count       = await prisma.fieldVisit.count({ where: { fieldAssignmentId: assignmentId } });
  const visitNumber = count + 1;

  const createOp = prisma.fieldVisit.create({
    data: {
      caseId:            assignment.caseId,
      fieldAssignmentId: assignmentId,
      visitNumber,
      status:            'STARTED',
      gpsLat:            data.gpsLat            ?? null,
      gpsLng:            data.gpsLng            ?? null,
      gpsAccuracyMeters: data.gpsAccuracyMeters ?? null,
      notes:             data.notes             ?? null,
      startedAt:         data.startedAt ? new Date(data.startedAt) : new Date(),
    },
    select: VISIT_SELECT,
  });

  const ops = [createOp];

  if (assignment.status === 'ASSIGNED') {
    ops.push(
      prisma.fieldAssignment.update({ where: { id: assignmentId }, data: { status: 'IN_PROGRESS' } }),
      prisma.bgvCase.update({ where: { id: assignment.caseId },    data: { status: 'FIELD_IN_PROGRESS' } }),
    );
  }

  const [visit] = await prisma.$transaction(ops);
  return visit;
};

const listVisitsByAssignment = async (assignmentId, tenantId) => {
  await assertAssignment(assignmentId, tenantId);
  return prisma.fieldVisit.findMany({
    where:   { fieldAssignmentId: assignmentId },
    select:  VISIT_SELECT,
    orderBy: { visitNumber: 'asc' },
  });
};

const getVisit = async (id, tenantId) => {
  await assertVisit(id, tenantId);
  return prisma.fieldVisit.findUnique({ where: { id }, select: VISIT_SELECT });
};

const updateVisit = async (id, tenantId, data) => {
  const existing = await assertVisit(id, tenantId);

  const updateData = {};
  if (data.status             !== undefined) updateData.status             = data.status;
  if (data.gpsLat             !== undefined) updateData.gpsLat             = data.gpsLat;
  if (data.gpsLng             !== undefined) updateData.gpsLng             = data.gpsLng;
  if (data.gpsAccuracyMeters  !== undefined) updateData.gpsAccuracyMeters  = data.gpsAccuracyMeters;
  if (data.notes              !== undefined) updateData.notes              = data.notes;
  if (data.verificationMode   !== undefined) updateData.verificationMode   = data.verificationMode;
  if (data.verificationStatus !== undefined) updateData.verificationStatus = data.verificationStatus;
  if (data.groundObservations !== undefined) updateData.groundObservations = data.groundObservations;
  if (data.fieldValues        !== undefined) updateData.fieldValues        = data.fieldValues;
  if (data.status === 'COMPLETED')           updateData.submittedAt        = new Date();

  const visitOp = prisma.fieldVisit.update({ where: { id }, data: updateData, select: VISIT_SELECT });
  const ops     = [visitOp];

  if (data.status === 'COMPLETED') {
    ops.push(
      prisma.fieldAssignment.update({
        where: { id: existing.fieldAssignmentId },
        data:  { status: 'SUBMITTED', submittedAt: new Date() },
      }),
      prisma.bgvCase.update({
        where: { id: existing.caseId },
        data:  { status: 'FIELD_SUBMITTED', fieldSubmittedAt: new Date() },
      }),
      prisma.caseStatusHistory.create({
        data: {
          caseId:    existing.caseId,
          newStatus: 'FIELD_SUBMITTED',
          remarks:   `Field visit #${existing.visitNumber} submitted by field executive`,
        },
      }),
    );
  }

  const [visit] = await prisma.$transaction(ops);
  return visit;
};

const uploadEvidence = async (visitId, tenantId, files, uploadedById) => {
  const visit = await assertVisit(visitId, tenantId);

  const saved = await Promise.all(
    files.map((file) => {
      const relativePath = `${storage.UPLOAD_ROOT}/evidence/${visitId}/${file.filename}`;
      const evidenceType = file.mimetype.startsWith('image/')
        ? 'PHOTO'
        : file.mimetype.startsWith('video/')
          ? 'VIDEO'
          : 'DOCUMENT';

      return prisma.evidenceFile.create({
        data: {
          caseId:       visit.caseId,
          fieldVisitId: visitId,
          uploadedById: uploadedById ?? null,
          evidenceType,
          filePath:     relativePath,
          fileName:     file.filename,
          originalName: file.originalname,
          mimeType:     file.mimetype,
          fileSizeKb:   Math.round(file.size / 1024),
        },
        select: EVIDENCE_SELECT,
      });
    })
  );

  return saved;
};

const listEvidence = async (visitId, tenantId) => {
  await assertVisit(visitId, tenantId);
  return prisma.evidenceFile.findMany({
    where:   { fieldVisitId: visitId },
    select:  EVIDENCE_SELECT,
    orderBy: { uploadedAt: 'desc' },
  });
};

module.exports = {
  createVisit,
  listVisitsByAssignment,
  getVisit,
  updateVisit,
  uploadEvidence,
  listEvidence,
};
