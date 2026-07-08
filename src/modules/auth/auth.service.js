const bcrypt  = require('bcryptjs');
const prisma   = require('../../config/database');
const { ValidationError, NotFoundError } = require('../../utils/errors');

const login = async (tenantId, email, password) => {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim(), tenantId },
    select: {
      id:           true,
      name:         true,
      email:        true,
      role:         true,
      isActive:     true,
      passwordHash: true,
      designation:  true,
      phone:        true,
      tenant:       { select: { id: true, name: true, slug: true } },
    },
  });

  if (!user)                  throw new ValidationError('Invalid email or password');
  if (!user.isActive)         throw new ValidationError('Your account has been deactivated. Contact your administrator.');

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match)                 throw new ValidationError('Invalid email or password');

  // Update last login timestamp (fire-and-forget, don't block response)
  prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
};

module.exports = { login };
