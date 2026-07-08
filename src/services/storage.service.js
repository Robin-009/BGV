const path = require('path');
const fs   = require('fs');

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || 'uploads';

const getStorageProvider = () => process.env.STORAGE_PROVIDER || 'LOCAL';

// ─── New naming system ────────────────────────────────────────────────────────

// FileKind → subfolder inside the case directory
const KIND_FOLDER = {
  ORIGINAL_PDF:      'documents',
  MD_SIGNOFF_LETTER: 'md-signoff',
  REPORT_PDF:        'reports',
  EVIDENCE_DOCUMENT: 'evidence',
  EVIDENCE_PHOTO:    'evidence',
  EVIDENCE_VIDEO:    'evidence',
  OCR_TEXT:          'ocr',
  STRUCTURED_JSON:   'ocr',
  EXCEL_EXPORT:      'exports',
  CONSENT_DOCUMENT:  'consent',
};

// FileKind → token used inside the filename
const KIND_LABEL = {
  ORIGINAL_PDF:      'original',
  MD_SIGNOFF_LETTER: 'mdsigned',
  REPORT_PDF:        'report',
  EVIDENCE_DOCUMENT: 'evidence',
  EVIDENCE_PHOTO:    'evidence',
  EVIDENCE_VIDEO:    'evidence',
};

const sanitizeSlug = (str) =>
  String(str).toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

// Absolute dir: uploads/cases/{caseRef}/{folder}/[{visitShort}/]
const buildCaseDirByRef = (caseRef, fileKind, visitShort = null) => {
  const folder = KIND_FOLDER[fileKind] || 'documents';
  if (visitShort && folder === 'evidence') {
    return path.join(process.cwd(), UPLOAD_ROOT, 'cases', caseRef, folder, visitShort);
  }
  return path.join(process.cwd(), UPLOAD_ROOT, 'cases', caseRef, folder);
};

// Relative path stored in DB: uploads/cases/{caseRef}/{folder}/[{visitShort}/]{fileName}
const buildRelativePathByRef = (caseRef, fileKind, fileName, visitShort = null) => {
  const folder = KIND_FOLDER[fileKind] || 'documents';
  if (visitShort && folder === 'evidence') {
    return `${UPLOAD_ROOT}/cases/${caseRef}/${folder}/${visitShort}/${fileName}`;
  }
  return `${UPLOAD_ROOT}/cases/${caseRef}/${folder}/${fileName}`;
};

// Count existing files in dir that share the same prefix → determine next sequence number
const getNextSequence = (dir, caseRef, fileKind, docType) => {
  const kindLabel = KIND_LABEL[fileKind] || 'file';
  const docSlug   = docType ? `_${sanitizeSlug(docType)}` : '';
  const prefix    = `${caseRef}_${kindLabel}${docSlug}_`;
  if (!fs.existsSync(dir)) return 1;
  const existing  = fs.readdirSync(dir).filter(f => f.startsWith(prefix));
  return existing.length + 1;
};

// Build filename: {caseRef}_{kindLabel}_{docTypeSlug}_{seq:02}{ext}
// e.g. GER-DEL-223_original_passport_01.pdf
const buildFileName = (caseRef, fileKind, docType, seq, ext) => {
  const kindLabel = KIND_LABEL[fileKind] || 'file';
  const docSlug   = docType ? `_${sanitizeSlug(docType)}` : '';
  const seqStr    = String(seq).padStart(2, '0');
  return `${caseRef}_${kindLabel}${docSlug}_${seqStr}${ext}`;
};

// ─── Legacy helpers (kept for backward compat — do not use for new uploads) ──

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
  ensureDir,
  sanitizeSlug,
  // New naming system
  KIND_FOLDER,
  KIND_LABEL,
  buildCaseDirByRef,
  buildRelativePathByRef,
  getNextSequence,
  buildFileName,
  // Legacy
  buildCaseDir,
  buildRelativePath,
  getKindSubdir,
  absoluteFromRelative,
};
