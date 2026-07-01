const { z } = require('zod');

const UserRole = z.enum(['MD', 'ADMIN', 'COORDINATOR', 'MANAGER', 'FIELD_EXECUTIVE', 'REPORT_WRITER', 'QUALITY_CONTROL']);

const createUserSchema = z.object({
  name:        z.string().min(2).max(100),
  email:       z.string().email(),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  role:        UserRole,
  phone:       z.string().max(20).optional(),
  address:     z.string().max(500).optional(),
  designation: z.string().max(100).optional(),
});

const updateUserSchema = z.object({
  name:        z.string().min(2).max(100).optional(),
  email:       z.string().email().optional(),
  role:        UserRole.optional(),
  phone:       z.string().max(20).optional(),
  address:     z.string().max(500).optional(),
  designation: z.string().max(100).optional(),
  isActive:    z.boolean().optional(),
});

const listUsersQuerySchema = z.object({
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(500).default(20),
  role:     UserRole.optional(),
  isActive: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  search:   z.string().optional(),
});

module.exports = { createUserSchema, updateUserSchema, listUsersQuerySchema };
