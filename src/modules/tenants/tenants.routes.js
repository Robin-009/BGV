const { Router } = require('express');
const tenantsController = require('./tenants.controller');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { createTenantSchema, updateTenantSchema, listTenantsQuerySchema } = require('./tenants.validation');

const router = Router();

// No tenant middleware here — tenants are platform-level, not tenant-scoped
router.get('/',     validateQuery(listTenantsQuerySchema), tenantsController.list);
router.get('/:id',                                         tenantsController.getById);
router.post('/',    validate(createTenantSchema),           tenantsController.create);
router.put('/:id',  validate(updateTenantSchema),           tenantsController.update);
router.delete('/:id',                                      tenantsController.remove);

module.exports = router;
