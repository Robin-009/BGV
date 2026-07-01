const { Router } = require('express');
const ctrl   = require('./fieldAssignments.controller');
const fvCtrl = require('../fieldVisits/fieldVisits.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const { createAssignmentSchema, updateAssignmentSchema, listAssignmentsQuerySchema } = require('./fieldAssignments.validation');
const { createVisitSchema } = require('../fieldVisits/fieldVisits.validation');

const router = Router();
router.use(resolveTenant);

// Global list (for FieldExecutiveDashboard — filter by fieldExecId, status, etc.)
router.get('/',    validateQuery(listAssignmentsQuerySchema), ctrl.list);
// Update assignment status
router.patch('/:id', validate(updateAssignmentSchema), ctrl.update);

// Nested visits under assignment
router.get( '/:assignmentId/visits', fvCtrl.listForAssignment);
router.post('/:assignmentId/visits', validate(createVisitSchema), fvCtrl.createForAssignment);

module.exports = router;
