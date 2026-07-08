const { Router } = require('express');
const ocrController  = require('./ocr.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');

const router = Router();
router.use(resolveTenant);

// POST /api/v1/cases/:id/files/:fileId/ocr  — trigger OCR for a specific file
router.post('/cases/:id/files/:fileId/ocr', ocrController.triggerOcr);

// POST /api/v1/cases/:id/ocr/batch  — run OCR for all files in a case in parallel
router.post('/cases/:id/ocr/batch', ocrController.batchOcr);

// GET /api/v1/ocr-jobs/:jobId  — poll job status
router.get('/ocr-jobs/:jobId', ocrController.getJob);

module.exports = router;
