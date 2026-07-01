const { Router } = require('express');
const ocrController  = require('./ocr.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');

const router = Router();
router.use(resolveTenant);

// POST /api/v1/cases/:id/files/:fileId/ocr  — trigger OCR for a specific file
router.post('/cases/:id/files/:fileId/ocr', ocrController.triggerOcr);

// GET /api/v1/ocr-jobs/:jobId  — poll job status
router.get('/ocr-jobs/:jobId', ocrController.getJob);

module.exports = router;
