const { Router } = require('express');
const path    = require('path');
const multer  = require('multer');
const { v4: uuidv4 } = require('uuid');

const casesController = require('./cases.controller');
const faController    = require('../fieldAssignments/fieldAssignments.controller');
const { resolveTenant } = require('../../middlewares/tenant.middleware');
const { validate, validateQuery } = require('../../middlewares/validate.middleware');
const storage = require('../../services/storage.service');
const {
  createCaseSchema,
  updateCaseSchema,
  updateStatusSchema,
  listCasesQuerySchema,
} = require('./cases.validation');
const { createAssignmentSchema } = require('../fieldAssignments/fieldAssignments.validation');

const router = Router();

// Multer: saves files to uploads/cases/:id/:kind/ on local disk
// fileKind passed as query param (?kind=ORIGINAL_PDF) so it's available before body parsing
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kind = req.query.kind || req.body?.fileKind || 'ORIGINAL_PDF';
    const dir  = storage.buildCaseDir(req.params.id, kind);
    storage.ensureDir(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${uuidv4()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: diskStorage,
  limits:  { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

const uploadAny = multer({ storage: diskStorage, limits: { fileSize: 20 * 1024 * 1024 } });

router.use(resolveTenant);

// Case CRUD
router.get( '/',                     validateQuery(listCasesQuerySchema), casesController.list);
router.get( '/:id',                                                       casesController.getById);
router.get( '/:id/full',                                                  casesController.getFullDetail);
router.post('/',                     validate(createCaseSchema),          casesController.create);
router.put( '/:id',                  validate(updateCaseSchema),          casesController.update);
router.patch('/:id/status',          validate(updateStatusSchema),        casesController.updateStatus);

// File management
router.get(   '/:id/files',                                               casesController.listFiles);
router.post(  '/:id/files',          upload.array('files', 10),           casesController.uploadFiles);
router.patch( '/:id/files/:fileId',                                       casesController.updateFileMeta);
router.delete('/:id/files/:fileId',                                       casesController.deleteFile);

// MD sign-off
router.post( '/:id/md-sign', casesController.mdSign);

// Comparison hub
router.get(  '/:id/comparison',          casesController.getComparison);
router.patch('/:id/coordinator-remarks', casesController.saveCoordinatorRemarks);

// Field assignments (nested under case)
router.get( '/:caseId/field-assignments',                               faController.listForCase);
router.post('/:caseId/field-assignments', validate(createAssignmentSchema), faController.createForCase);

module.exports = router;
