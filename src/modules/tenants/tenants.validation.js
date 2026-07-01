const { z } = require('zod');

const createTenantSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
});

const updateTenantSchema = z.object({
  name:   z.string().min(2).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

const listTenantsQuerySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  search: z.string().optional(),
});

module.exports = { createTenantSchema, updateTenantSchema, listTenantsQuerySchema };
