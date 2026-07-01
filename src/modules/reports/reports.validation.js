const { z } = require('zod');

const createReportSchema = z.object({
  caseId:             z.string().uuid(),
  coordinatorRemarks: z.string().max(2000).optional(),
  requiresQc:         z.boolean().optional().default(true),
});

const updateReportSchema = z.object({
  coordinatorRemarks: z.string().max(2000).optional(),
  managerRemarks:     z.string().max(2000).optional(),
  qcRemarks:          z.string().max(2000).optional(),
});

const submitForQcSchema = z.object({
  coordinatorRemarks: z.string().max(2000).optional(),
});

const qcDecisionSchema = z.object({
  verdict:   z.enum(['APPROVED', 'REJECTED']),
  qcRemarks: z.string().min(1, 'QC remarks are required').max(2000),
});

const listReportsQuerySchema = z.object({
  status:  z.string().optional(),
  caseId:  z.string().uuid().optional(),
  page:    z.coerce.number().int().positive().default(1),
  limit:   z.coerce.number().int().positive().max(100).default(20),
});

module.exports = {
  createReportSchema,
  updateReportSchema,
  submitForQcSchema,
  qcDecisionSchema,
  listReportsQuerySchema,
};
