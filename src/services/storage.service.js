const path = require('path');
const fs   = require('fs');

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || 'uploads';

const getStorageProvider = () => process.env.STORAGE_PROVIDER || 'LOCAL';

const KIND_SUBDIR = {
  ORIGINAL_PDF:      'original',
  OCR_TEXT:          'ocr',
  STRUCTURED_JSON:   'ocr',
  EXCEL_EXPORT:      'exports',
  REPORT_PDF:        'reports',
  MD_SIGNOFF_LETTER: 'md-signoff',
  EVIDENCE_DOCUMENT: 'evidence',
  EVIDENCE_PHOTO:    'evidence',
  EVIDENCE_VIDEO:    'evidence',
  CONSENT_DOCUMENT:  'consent',
};

const getKindSubdir = (fileKind) => KIND_SUBDIR[fileKind] || 'original';

const buildCaseDir = (caseId, fileKind) => {
  const sub = fileKind ? getKindSubdir(fileKind) : '';
  return sub
    ? path.join(process.cwd(), UPLOAD_ROOT, 'cases', caseId, sub)
    : path.join(process.cwd(), UPLOAD_ROOT, 'cases', caseId);
};

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const buildRelativePath = (caseId, fileName, fileKind) => {
  const sub = fileKind ? getKindSubdir(fileKind) : '';
  return sub
    ? `${UPLOAD_ROOT}/cases/${caseId}/${sub}/${fileName}`
    : `${UPLOAD_ROOT}/cases/${caseId}/${fileName}`;
};

const absoluteFromRelative = (relativePath) =>
  path.join(process.cwd(), relativePath);

module.exports = {
  UPLOAD_ROOT,
  getStorageProvider,
  buildCaseDir,
  ensureDir,
  buildRelativePath,
  getKindSubdir,
  absoluteFromRelative,
};
