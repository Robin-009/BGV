const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { NotFoundError, ConflictError } = require('../../utils/errors');

const SALT_ROUNDS = 12;

const USER_SELECT = {
  id:          true,
  name:        true,
  email:       true,
  phone:       true,
  address:     true,
  designation: true,
  role:        true,
  isActive:    true,
  lastLoginAt: true,
  createdAt:   true,
  updatedAt:   true,
};

const listUsers = async ({ tenantId, page, limit, role, isActive, search } = {}) => {
  page  = Number(page)  || 1;
  limit = Number(limit) || 20;
  const where = {
    tenantId,
    ...(role !== undefined && { role }),
    ...(isActive !== undefined && { isActive }),
    ...(search && {
      OR: [
        { name:        { contains: search, mode: 'insensitive' } },
        { email:       { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: USER_SELECT,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    users,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

const getUserById = async (id, tenantId) => {
  const user = await prisma.user.findFirst({
    where: { id, tenantId },
    select: {
      ...USER_SELECT,
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
};

const createUser = async ({ tenantId, name, email, password, role, phone, address, designation }) => {
  const existing = await prisma.user.findFirst({ where: { email, tenantId } });
  if (existing) throw new ConflictError('A user with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      tenantId,
      name,
      email,
      passwordHash,
      role,
      phone:       phone ?? null,
      address:     address ?? null,
      designation: designation ?? null,
    },
    select: USER_SELECT,
  });
};

const getUserByEmail = async (email, tenantId) => {
  const user = await prisma.user.findFirst({
    where: { email, tenantId },
    select: {
      ...USER_SELECT,
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
  if (!user) throw new NotFoundError('User');
  return user;
};

const updateUser = async (id, tenantId, updates) => {
  await getUserById(id, tenantId);

  if (updates.email) {
    const conflict = await prisma.user.findFirst({
      where: { email: updates.email, tenantId, NOT: { id } },
    });
    if (conflict) throw new ConflictError('Email already in use by another user');
  }

  return prisma.user.update({
    where: { id },
    data: updates,
    select: USER_SELECT,
  });
};

const deactivateUser = async (id, tenantId) => {
  await getUserById(id, tenantId);
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, isActive: true },
  });
};

const toggleUserStatus = async (id, tenantId) => {
  const user = await getUserById(id, tenantId);
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
    select: { id: true, isActive: true },
  });
};

module.exports = { listUsers, getUserById, getUserByEmail, createUser, updateUser, deactivateUser, toggleUserStatus };
