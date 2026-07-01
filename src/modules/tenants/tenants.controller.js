const tenantsService = require('./tenants.service');
const { success, paginated } = require('../../utils/response');
const { listTenantsQuerySchema } = require('./tenants.validation');

const list = async (req, res, next) => {
  try {
    const query = listTenantsQuerySchema.parse(req.query);
    const { tenants, meta } = await tenantsService.listTenants(query);
    paginated(res, tenants, meta);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tenant = await tenantsService.getTenantById(req.params.id);
    success(res, tenant);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const tenant = await tenantsService.createTenant(req.body);
    success(res, tenant, 'Tenant created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const tenant = await tenantsService.updateTenant(req.params.id, req.body);
    success(res, tenant, 'Tenant updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await tenantsService.deleteTenant(req.params.id);
    success(res, result, 'Tenant deactivated');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, create, update, remove };
