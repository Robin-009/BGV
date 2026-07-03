const path         = require('path');
const casesService = require('./cases.service');
const storage      = require('../../services/storage.service');
const { success, paginated } = require('../../utils/response');
const { listCasesQuerySchema } = require('./cases.validation');

const list = async (req, res, next) => {
  try {
    const query = listCasesQuerySchema.parse(req.query);
    const { cases, meta } = await casesService.listCases({ tenantId: req.tenantId, ...query });
    paginated(res, cases, meta);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const bgvCase = await casesService.getCaseById(req.params.id, req.tenantId);
    success(res, bgvCase);
  } catch (err) {
    next(err);
  }
};

const getFullDetail = async (req, res, next) => {
  try {
    const data = await casesService.getFullCase(req.params.id, req.tenantId);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const bgvCase = await casesService.createCase({ tenantId: req.tenantId, ...req.body });
    success(res, bgvCase, 'Case created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const bgvCase = await casesService.updateCase(req.params.id, req.tenantId, req.body);
    success(res, bgvCase, 'Case updated successfully');
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const bgvCase = await casesService.updateCaseStatus(
      req.params.id, req.tenantId, status, remarks, req.body.changedById
    );
    success(res, bgvCase, `Case status updated to ${status}`);
  } catch (err) {
    next(err);
  }
};

const listFiles = async (req, res, next) => {
  try {
    const files = await casesService.getCaseFiles(req.params.id, req.tenantId);
    success(res, files);
  } catch (err) {
    next(err);
  }
};

const uploadFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const caseId     = req.params.id;
    const uploadedBy = req.body.uploadedById ?? null;
    const fileKind   = req.query.kind || req.body.fileKind || 'ORIGINAL_PDF';

    // Ensure the case belongs to this tenant
    await casesService.getCaseById(caseId, req.tenantId);

    const saved = await Promise.all(
      req.files.map((file) => {
        const relativePath = storage.buildRelativePath(caseId, file.filename, fileKind);
        return casesService.addCaseFile({
          caseId,
          uploadedById:  uploadedBy,
          fileKind,
          filePath:      relativePath,
          fileName:      file.filename,
          originalName:  file.originalname,
          mimeType:      file.mimetype,
          fileSizeKb:    Math.round(file.size / 1024),
        });
      })
    );

    success(res, saved, `${saved.length} file(s) uploaded successfully`, 201);
  } catch (err) {
    next(err);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const result = await casesService.removeCaseFile(
      req.params.id, req.params.fileId, req.tenantId
    );
    success(res, result, 'File removed');
  } catch (err) {
    next(err);
  }
};

const updateFileMeta = async (req, res, next) => {
  try {
    const result = await casesService.updateFileMetadata(
      req.params.id, req.params.fileId, req.tenantId, req.body.metadata
    );
    success(res, result, 'File metadata updated');
  } catch (err) {
    next(err);
  }
};

const getComparison = async (req, res, next) => {
  try {
    const data = await casesService.getComparisonData(req.params.id, req.tenantId);
    success(res, data);
  } catch (err) {
    next(err);
  }
};

const saveCoordinatorRemarks = async (req, res, next) => {
  try {
    const result = await casesService.updateCoordinatorRemarks(
      req.params.id, req.tenantId, req.body.remarks
    );
    success(res, result, 'Remarks saved');
  } catch (err) {
    next(err);
  }
};

const mdSign = async (req, res, next) => {
  try {
    const result = await casesService.mdSignCase(req.params.id, req.tenantId, {
      signedBy: req.body.signedBy || 'MD',
      remarks:  req.body.remarks  || null,
    });
    success(res, result, 'Case MD signed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, getFullDetail, create, update, updateStatus, listFiles, uploadFiles, deleteFile, updateFileMeta, getComparison, saveCoordinatorRemarks, mdSign };
