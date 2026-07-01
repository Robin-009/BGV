const prisma = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/errors');

const TENANT_SELECT = {
  id:        true,
  name:      true,
  slug:      true,
  status:    true,
  createdAt: true,
  updatedAt: true,
};

const listTenants = async ({ page, limit, status, search } = {}) => {
  page  = Number(page)  || 1;
  limit = Number(limit) || 20;
  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({
      where,
      select: TENANT_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    tenants,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getTenantById = async (id) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    select: {
      ...TENANT_SELECT,
      _count: {
        select: { users: true, cases: true },
      },
    },
  });
  if (!tenant) throw new NotFoundError('Tenant');
  return tenant;
};

const createTenant = async ({ name, slug }) => {
  const existing = await prisma.tenant.findUnique({ where: { slug } });
  if (existing) throw new ConflictError(`Slug "${slug}" is already taken`);

  return prisma.tenant.create({
    data: { name, slug, status: 'ACTIVE' },
    select: TENANT_SELECT,
  });
};

const updateTenant = async (id, updates) => {
  await getTenantById(id);

  return prisma.tenant.update({
    where: { id },
    data: updates,
    select: TENANT_SELECT,
  });
};

const deleteTenant = async (id) => {
  await getTenantById(id);
  return prisma.tenant.update({
    where: { id },
    data: { status: 'INACTIVE' },
    select: { id: true, status: true },
  });
};

module.exports = { listTenants, getTenantById, createTenant, updateTenant, deleteTenant };
