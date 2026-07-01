const { z } = require('zod');

const CaseType = z.enum(['DRIVER_BGV', 'EMBASSY_BGV_1', 'EMBASSY_BGV_2', 'CORPORATE_BGV']);

const CaseStatus = z.enum([
  'CREATED', 'OCR_PENDING', 'OCR_IN_PROGRESS', 'OCR_COMPLETED',
  'FIELD_ASSIGNED', 'FIELD_IN_PROGRESS', 'FIELD_SUBMITTED',
  'UNDER_REVIEW', 'REPORT_DRAFT', 'QC_PENDING', 'QC_COMPLETED',
  'REPORT_APPROVED', 'FINAL', 'REJECTED', 'ERROR', 'ARCHIVED',
]);

const createCaseSchema = z.object({
  clientRefId:          z.string().regex(/^[A-Z0-9\-]+$/i, 'Use letters, numbers and hyphens only').optional(),
  clientName:           z.string().min(1).optional(),
  candidateName:        z.string().min(1, 'Candidate name is required'),
  caseType:             CaseType,
  initiationDate:       z.string().datetime({ offset: true }).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  createdById:          z.string().uuid().optional(),
  tatDueDays:           z.number().int().positive().optional(),
});

const updateCaseSchema = z.object({
  clientRefId:          z.string().regex(/^[A-Z0-9\-]+$/i).optional(),
  clientName:           z.string().min(1).optional(),
  candidateName:        z.string().min(1).optional(),
  caseType:             CaseType.optional(),
  initiationDate:       z.string().datetime({ offset: true }).optional(),
  assignedCoordinatorId: z.string().uuid().optional(),
  tatDueDays:           z.number().int().positive().optional(),
});

const updateStatusSchema = z.object({
  status:  CaseStatus,
  remarks: z.string().optional(),
});

const listCasesQuerySchema = z.object({
  page:       z.coerce.number().int().positive().default(1),
  limit:      z.coerce.number().int().positive().max(100).default(20),
  status:     z.string().optional().transform(val => {
    if (!val) return undefined;
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }).pipe(z.array(CaseStatus).optional()),
  caseType:   CaseType.optional(),
  search:     z.string().optional(),
  fromDate:   z.string().optional(),
  toDate:     z.string().optional(),
});

module.exports = {
  createCaseSchema,
  updateCaseSchema,
  updateStatusSchema,
  listCasesQuerySchema,
};
