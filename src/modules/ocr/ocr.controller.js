const ocrService = require('./ocr.service');
const { success } = require('../../utils/response');

const triggerOcr = async (req, res, next) => {
  try {
    const { id: caseId, fileId } = req.params;
    const { docType } = req.body;
    const result = await ocrService.runOcr(caseId, fileId, req.tenantId, docType);
    success(res, result, 'OCR completed');
  } catch (err) {
    // Surface OCR-specific errors with a readable message instead of generic 500
    if (err.message?.includes('OCR service') || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
      return res.status(502).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const batchOcr = async (req, res, next) => {
  try {
    const { id: caseId } = req.params;
    const result = await ocrService.runBatchOcr(caseId, req.tenantId);
    success(res, result, `Batch OCR complete: ${result.succeeded}/${result.processed} succeeded`);
  } catch (err) {
    if (err.message?.includes('OCR service') || err.message?.includes('Unauthorized') || err.message?.includes('401')) {
      return res.status(502).json({ success: false, message: err.message });
    }
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await ocrService.getOcrJob(req.params.jobId);
    success(res, job);
  } catch (err) {
    next(err);
  }
};

module.exports = { triggerOcr, batchOcr, getJob };
