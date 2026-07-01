const { Router } = require('express');
const usersController = require('./users.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { createUserSchema, updateUserSchema, listUsersQuerySchema } = require('./users.validation');

const router = Router();

router.use(resolveTenant);

router.get('/',              validateQuery(listUsersQuerySchema), usersController.list);
router.get('/email/:email',                               usersController.getByEmail);
router.get('/:id',                                        usersController.getById);
router.post('/',    validate(createUserSchema),           usersController.create);
router.put('/:id',  validate(updateUserSchema),           usersController.update);
router.delete('/:id',                                    usersController.deactivate);
router.patch('/:id/toggle-status',                       usersController.toggleStatus);

module.exports = router;
