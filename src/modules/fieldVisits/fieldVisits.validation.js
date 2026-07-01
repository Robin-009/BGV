const { z } = require('zod');

const VISIT_STATUS = ['STARTED', 'COMPLETED', 'CANCELLED'];

const createVisitSchema = z.object({
  gpsLat:            z.coerce.number().min(-90).max(90).optional(),
  gpsLng:            z.coerce.number().min(-180).max(180).optional(),
  gpsAccuracyMeters: z.coerce.number().positive().optional(),
  notes:             z.string().max(2000).optional(),
  startedAt:         z.string().datetime().optional(),
});

const updateVisitSchema = z.object({
  status:             z.enum(VISIT_STATUS).optional(),
  gpsLat:             z.coerce.number().min(-90).max(90).optional(),
  gpsLng:             z.coerce.number().min(-180).max(180).optional(),
  gpsAccuracyMeters:  z.coerce.number().positive().optional(),
  notes:              z.string().max(2000).optional(),
  verificationMode:   z.enum(['verbal', 'physical', 'both']).optional(),
  verificationStatus: z.string().max(100).optional(),
  groundObservations: z.record(z.string(), z.string()).optional(),
});

const listVisitsQuerySchema = z.object({
  status: z.enum(VISIT_STATUS).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
});

module.exports = { createVisitSchema, updateVisitSchema, listVisitsQuerySchema };
