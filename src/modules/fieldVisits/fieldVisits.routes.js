const path = require('path');
const fs   = require('fs');
const { Router } = require('express');
const multer     = require('multer');
const { v4: uuidv4 } = require('uuid');

const ctrl   = require('./fieldVisits.controller');
const { resolveTenant }  = require('../../middlewares/tenant.middleware');
const { validate }       = require('../../middlewares/validate.middleware');
const { updateVisitSchema } = require('./fieldVisits.validation');
const storage = require('../../services/storage.service');

const router = Router();
router.use(resolveTenant);

// Evidence: uploads/cases/{caseRef}/evidence/{visitShort}/
// caseRef → query param ?caseRef=GER-DEL-223
const evidenceDisk = multer.diskStorage({
  destination: (req, file, cb) => {
    const caseRef    = req.query.caseRef || 'unknown';
    const visitShort = req.params.id.slice(0, 8);
    const kind       = file.mimetype.startsWith('video/') ? 'EVIDENCE_VIDEO'
                     : file.mimetype.startsWith('image/') ? 'EVIDENCE_PHOTO'
                     : 'EVIDENCE_DOCUMENT';
    const dir = storage.buildCaseDirByRef(caseRef, kind, visitShort);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const caseRef    = req.query.caseRef || 'unknown';
    const visitShort = req.params.id.slice(0, 8);
    const kind       = file.mimetype.startsWith('video/') ? 'EVIDENCE_VIDEO'
                     : file.mimetype.startsWith('image/') ? 'EVIDENCE_PHOTO'
                     : 'EVIDENCE_DOCUMENT';
    const ext  = path.extname(file.originalname);
    const dir  = storage.buildCaseDirByRef(caseRef, kind, visitShort);
    const seq  = storage.getNextSequence(dir, caseRef, kind, null);
    const name = storage.buildFileName(caseRef, kind, null, seq, ext);
    cb(null, name);
  },
});

const evidenceUpload = multer({
  storage: evidenceDisk,
  limits:  { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
  },
});

router.get(  '/:id',          ctrl.getById);
router.patch('/:id',          validate(updateVisitSchema), ctrl.update);
router.get(  '/:id/evidence', ctrl.listEvidence);
router.post( '/:id/evidence', evidenceUpload.array('files', 20), ctrl.uploadEvidence);

module.exports = router;
