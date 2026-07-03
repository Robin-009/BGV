const { z } = require('zod');

const SCHEDULE_STATUSES = ['PLANNED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const DOC_STATUSES      = ['PENDING', 'COLLECTED', 'NOT_AVAILABLE', 'NEEDS_REVISIT'];

const docSchema = z.object({
  caseNumber:        z.string().max(100).optional(),
  candidateName:     z.string().max(200).optional(),
  docRef:            z.string().max(200).optional(),
  docType:           z.string().min(1).max(200),
  institution:       z.string().max(500).optional(),
  locationCity:      z.string().max(100).optional(),
  locationDistrict:  z.string().max(100).optional(),
  locationState:     z.string().max(100).optional(),
  status:            z.enum(DOC_STATUSES).optional().default('PENDING'),
  verificationNotes: z.string().max(2000).optional(),
  personMet:         z.string().max(200).optional(),
});

const createScheduleSchema = z.object({
  fieldExecId:      z.string().uuid('fieldExecId must be a valid UUID'),
  scheduledDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'scheduledDate must be YYYY-MM-DD'),
  locationState:    z.string().max(100).optional(),
  locationDistrict: z.string().max(100).optional(),
  locationCity:     z.string().max(100).optional(),
  status:           z.enum(SCHEDULE_STATUSES).optional().default('PLANNED'),
  overallNotes:     z.string().max(2000).optional(),
  docs:             z.array(docSchema).optional().default([]),
});

const updateScheduleSchema = z.object({
  fieldExecId:      z.string().uuid().optional(),
  scheduledDate:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  locationState:    z.string().max(100).optional(),
  locationDistrict: z.string().max(100).optional(),
  locationCity:     z.string().max(100).optional(),
  status:           z.enum(SCHEDULE_STATUSES).optional(),
  overallNotes:     z.string().max(2000).optional(),
  docs:             z.array(docSchema).optional(),
});

const updateDocSchema = z.object({
  status:            z.enum(DOC_STATUSES),
  verificationNotes: z.string().max(2000).optional(),
  personMet:         z.string().max(200).optional(),
});

const listSchedulesQuerySchema = z.object({
  fieldExecId: z.string().uuid().optional(),
  caseId:      z.string().uuid().optional(),
  status:      z.enum(SCHEDULE_STATUSES).optional(),
  from:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to:          z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page:        z.coerce.number().int().positive().default(1),
  limit:       z.coerce.number().int().positive().max(200).default(50),
});

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  updateDocSchema,
  listSchedulesQuerySchema,
};
