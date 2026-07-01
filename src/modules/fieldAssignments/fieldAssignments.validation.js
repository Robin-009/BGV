const { z } = require('zod');

const ASSIGNMENT_STATUS = ['ASSIGNED','IN_PROGRESS','SUBMITTED','UNDER_REVIEW','REJECTED','COMPLETED','CANCELLED'];

const createAssignmentSchema = z.object({
  fieldExecId:  z.string().uuid('fieldExecId must be a valid UUID'),
  assignedById: z.string().uuid().optional(),
  remarks:      z.string().max(1000).optional(),
});

const updateAssignmentSchema = z.object({
  status:  z.enum(ASSIGNMENT_STATUS),
  remarks: z.string().max(1000).optional(),
});

const listAssignmentsQuerySchema = z.object({
  fieldExecId: z.string().uuid().optional(),
  caseId:      z.string().uuid().optional(),
  status:      z.enum(ASSIGNMENT_STATUS).optional(),
  page:        z.coerce.number().int().positive().default(1),
  limit:       z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createAssignmentSchema, updateAssignmentSchema, listAssignmentsQuerySchema };
