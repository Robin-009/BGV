const express  = require('express');
const ctrl     = require('./reports.controller');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const {
  createReportSchema,
  updateReportSchema,
  submitForQcSchema,
  qcDecisionSchema,
  listReportsQuerySchema,
} = require('./reports.validation');

const router = express.Router();

// Collection
router.get('/',    validateQuery(listReportsQuerySchema), ctrl.list);
router.post('/',   validate(createReportSchema),          ctrl.create);

// Per-report actions
router.get('/:id',              ctrl.getById);
router.patch('/:id',            validate(updateReportSchema),  ctrl.update);
router.post('/:id/submit-for-qc', validate(submitForQcSchema), ctrl.submitForQc);
router.post('/:id/qc-decision', validate(qcDecisionSchema),   ctrl.qcDecision);

// Convenience: latest report for a case (consumed by ReportWriterTerminal)
router.get('/case/:caseId',     ctrl.getForCase);

module.exports = router;
