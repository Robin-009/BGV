const prisma = require('../../config/database');
const { NotFoundError, ValidationError } = require('../../utils/errors');

// ── Status mappings ────────────────────────────────────────────────────────────
const SCHED_STATUS_TO_FE  = { PLANNED:'Planned', CONFIRMED:'Confirmed', IN_PROGRESS:'In Progress', COMPLETED:'Completed', CANCELLED:'Cancelled' };
const DOC_STATUS_TO_FE    = { PENDING:'pending', COLLECTED:'collected', NOT_AVAILABLE:'not_available', NEEDS_REVISIT:'needs_revisit' };

// ── Prisma select shape ────────────────────────────────────────────────────────
const SCHEDULE_SELECT = {
  id: true, status: true, scheduledDate: true,
  locationState: true, locationDistrict: true, locationCity: true,
  overallNotes: true, createdAt: true, updatedAt: true,
  fieldExec:  { select: { id: true, name: true, email: true, phone: true, designation: true } },
  createdBy:  { select: { id: true, name: true } },
  docs: {
    select: {
      id: true, caseDbId: true, caseNumber: true, candidateName: true,
      docRef: true, docType: true, institution: true,
      locationCity: true, locationDistrict: true, locationState: true,
      status: true, verificationNotes: true, personMet: true,
      createdAt: true, updatedAt: true,
      caseDb: {
        select: {
          files: {
            select: { id: true, metadata: true, originalName: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
};

// ── Normalize to frontend-compatible shape ─────────────────────────────────────
function toFrontend(s) {
  return {
    id:          s.id,
    date:        s.scheduledDate.toISOString().slice(0, 10),
    location:    { state: s.locationState || '', district: s.locationDistrict || '', city: s.locationCity || '' },
    assignedFEs: [s.fieldExec.id],
    fieldExec:   s.fieldExec,
    status:      SCHED_STATUS_TO_FE[s.status] || s.status,
    overallNotes:s.overallNotes || '',
    createdBy:   s.createdBy?.name || 'admin',
    createdAt:   s.createdAt.toISOString(),
    updatedAt:   s.updatedAt.toISOString(),
    attachedDocs:(s.docs || []).map(doc => {
      // Pick saved OCR fields from CaseFile.metadata — prefer file whose docType matches
      const caseFiles = doc.caseDb?.files || [];
      const matchedFile = caseFiles.find(f => f.metadata?.docType === doc.docType) || caseFiles[0] || null;
      const extractedData = matchedFile?.metadata?.ocrFields || {};
      const savedLocation = matchedFile?.metadata?.location  || {};

      return {
        key:              doc.id,
        _dbDocId:         doc.id,
        _scheduleId:      s.id,
        caseId:           doc.caseNumber || doc.caseDbId || '',
        caseDbId:         doc.caseDbId || null,
        candidateName:    doc.candidateName || '',
        docId:            doc.docRef || doc.id,
        docType:          doc.docType,
        institution:      doc.institution || '',
        location: {
          city:     doc.locationCity     || savedLocation.city     || '',
          district: doc.locationDistrict || savedLocation.district || '',
          state:    doc.locationState    || savedLocation.state    || '',
        },
        status:           DOC_STATUS_TO_FE[doc.status] || doc.status.toLowerCase(),
        verificationNotes:doc.verificationNotes || '',
        personMet:        doc.personMet || '',
        extractedData,
        fields:           Object.keys(extractedData),
      };
    }),
  };
}

// ── Try to resolve caseDbId from caseNumber ───────────────────────────────────
async function resolveCaseId(caseNumber, tenantId) {
  if (!caseNumber) return null;
  const c = await prisma.bgvCase.findFirst({ where: { caseNumber, tenantId }, select: { id: true } });
  return c?.id || null;
}

// ── Build doc create input ─────────────────────────────────────────────────────
async function buildDocInput(doc, tenantId) {
  return {
    caseDbId:         await resolveCaseId(doc.caseNumber, tenantId),
    caseNumber:       doc.caseNumber       || null,
    candidateName:    doc.candidateName    || null,
    docRef:           doc.docRef           || null,
    docType:          doc.docType,
    institution:      doc.institution      || null,
    locationCity:     doc.locationCity     || null,
    locationDistrict: doc.locationDistrict || null,
    locationState:    doc.locationState    || null,
    status:           doc.status           || 'PENDING',
    verificationNotes:doc.verificationNotes|| null,
    personMet:        doc.personMet        || null,
  };
}

// ── Service functions ──────────────────────────────────────────────────────────
const createSchedule = async (tenantId, body) => {
  const { fieldExecId, scheduledDate, locationState, locationDistrict, locationCity,
          status, overallNotes, docs, createdById } = body;

  const exec = await prisma.user.findFirst({
    where: { id: fieldExecId, tenantId, role: 'FIELD_EXECUTIVE', isActive: true },
    select: { id: true },
  });
  if (!exec) throw new NotFoundError('Field executive not found or not active');

  const docInputs = await Promise.all((docs || []).map(d => buildDocInput(d, tenantId)));

  const schedule = await prisma.fieldVisitSchedule.create({
    data: {
      tenantId,
      fieldExecId,
      createdById: createdById || null,
      scheduledDate: new Date(scheduledDate),
      locationState:    locationState    || null,
      locationDistrict: locationDistrict || null,
      locationCity:     locationCity     || null,
      status:           status           || 'PLANNED',
      overallNotes:     overallNotes     || null,
      docs: { create: docInputs },
    },
    select: SCHEDULE_SELECT,
  });

  return toFrontend(schedule);
};

const listSchedules = async (tenantId, { fieldExecId, status, from, to, page, limit } = {}) => {
  page  = Number(page)  || 1;
  limit = Number(limit) || 20;
  const where = {
    tenantId,
    ...(fieldExecId && { fieldExecId }),
    ...(status      && { status }),
    ...(from || to) && {
      scheduledDate: {
        ...(from && { gte: new Date(from) }),
        ...(to   && { lte: new Date(to)   }),
      },
    },
  };

  const [total, schedules] = await Promise.all([
    prisma.fieldVisitSchedule.count({ where }),
    prisma.fieldVisitSchedule.findMany({
      where,
      select:  SCHEDULE_SELECT,
      orderBy: { scheduledDate: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
  ]);

  return {
    schedules: schedules.map(toFrontend),
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getSchedule = async (id, tenantId) => {
  const schedule = await prisma.fieldVisitSchedule.findFirst({
    where: { id, tenantId },
    select: SCHEDULE_SELECT,
  });
  if (!schedule) throw new NotFoundError('Visit schedule');
  return toFrontend(schedule);
};

const updateSchedule = async (id, tenantId, body) => {
  const existing = await prisma.fieldVisitSchedule.findFirst({
    where: { id, tenantId },
    select: { id: true, fieldExecId: true },
  });
  if (!existing) throw new NotFoundError('Visit schedule');

  const updateData = {};

  if (body.fieldExecId && body.fieldExecId !== existing.fieldExecId) {
    const exec = await prisma.user.findFirst({
      where: { id: body.fieldExecId, tenantId, role: 'FIELD_EXECUTIVE', isActive: true },
      select: { id: true },
    });
    if (!exec) throw new NotFoundError('Field executive not found or not active');
    updateData.fieldExecId = body.fieldExecId;
  }

  if (body.scheduledDate !== undefined) updateData.scheduledDate    = new Date(body.scheduledDate);
  if (body.locationState    !== undefined) updateData.locationState    = body.locationState    || null;
  if (body.locationDistrict !== undefined) updateData.locationDistrict = body.locationDistrict || null;
  if (body.locationCity     !== undefined) updateData.locationCity     = body.locationCity     || null;
  if (body.status           !== undefined) updateData.status           = body.status;
  if (body.overallNotes     !== undefined) updateData.overallNotes     = body.overallNotes     || null;

  // If docs provided, replace them entirely
  if (body.docs !== undefined) {
    const docInputs = await Promise.all(body.docs.map(d => buildDocInput(d, tenantId)));
    await prisma.$transaction([
      prisma.fieldVisitScheduleDoc.deleteMany({ where: { visitScheduleId: id } }),
      prisma.fieldVisitSchedule.update({
        where: { id },
        data:  { ...updateData, docs: { create: docInputs } },
      }),
    ]);
  } else {
    await prisma.fieldVisitSchedule.update({ where: { id }, data: updateData });
  }

  const updated = await prisma.fieldVisitSchedule.findFirst({ where: { id }, select: SCHEDULE_SELECT });
  return toFrontend(updated);
};

const deleteSchedule = async (id, tenantId) => {
  const existing = await prisma.fieldVisitSchedule.findFirst({
    where: { id, tenantId },
    select: { id: true },
  });
  if (!existing) throw new NotFoundError('Visit schedule');

  await prisma.fieldVisitSchedule.delete({ where: { id } });
};

const updateScheduleDoc = async (scheduleId, docId, tenantId, body) => {
  const schedule = await prisma.fieldVisitSchedule.findFirst({
    where: { id: scheduleId, tenantId },
    select: { id: true },
  });
  if (!schedule) throw new NotFoundError('Visit schedule');

  const doc = await prisma.fieldVisitScheduleDoc.findFirst({
    where: { id: docId, visitScheduleId: scheduleId },
    select: { id: true },
  });
  if (!doc) throw new NotFoundError('Visit schedule document');

  const updated = await prisma.fieldVisitScheduleDoc.update({
    where: { id: docId },
    data:  {
      status:            body.status,
      verificationNotes: body.verificationNotes !== undefined ? (body.verificationNotes || null) : undefined,
      personMet:         body.personMet         !== undefined ? (body.personMet         || null) : undefined,
    },
    select: {
      id: true, status: true, verificationNotes: true, personMet: true,
      caseNumber: true, candidateName: true, docType: true, institution: true,
      updatedAt: true,
    },
  });

  return {
    ...updated,
    status: DOC_STATUS_TO_FE[updated.status] || updated.status.toLowerCase(),
  };
};

module.exports = { createSchedule, listSchedules, getSchedule, updateSchedule, deleteSchedule, updateScheduleDoc };
