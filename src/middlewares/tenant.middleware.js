const prisma = require('../config/database');
const { ValidationError, NotFoundError } = require('../utils/errors');

// Temporary middleware until JWT is implemented.
// Reads tenantId from x-tenant-id header and attaches the tenant to req.
const resolveTenant = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      return next(new ValidationError('Missing x-tenant-id header'));
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.status !== 'ACTIVE') {
      return next(new NotFoundError('Tenant'));
    }

    req.tenantId = tenant.id;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { resolveTenant };
