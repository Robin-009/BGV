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

// Evidence files go to uploads/evidence/:visitId/
const evidenceDisk = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), storage.UPLOAD_ROOT, 'evidence', req.params.id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
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
