const { Router } = require('express');
const ctrl = require('./visitSchedules.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const {
  createScheduleSchema,
  updateScheduleSchema,
  updateDocSchema,
  listSchedulesQuerySchema,
} = require('./visitSchedules.validation');

const router = Router();
router.use(resolveTenant);

router.get('/',     validateQuery(listSchedulesQuerySchema), ctrl.list);
router.post('/',    validate(createScheduleSchema),          ctrl.create);
router.get('/:id',  ctrl.get);
router.put('/:id',  validate(updateScheduleSchema),          ctrl.update);
router.delete('/:id', ctrl.remove);

// Update a single document's verification status
router.patch('/:id/docs/:docId', validate(updateDocSchema), ctrl.updateDoc);

module.exports = router;
