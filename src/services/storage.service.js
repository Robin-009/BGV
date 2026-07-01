const path = require('path');
const fs   = require('fs');

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || 'uploads';

const getStorageProvider = () => process.env.STORAGE_PROVIDER || 'LOCAL';

const buildCaseDir = (caseId) =>
  path.join(process.cwd(), UPLOAD_ROOT, 'cases', caseId);

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const buildRelativePath = (caseId, fileName) =>
  `${UPLOAD_ROOT}/cases/${caseId}/${fileName}`;

const absoluteFromRelative = (relativePath) =>
  path.join(process.cwd(), relativePath);

module.exports = {
  UPLOAD_ROOT,
  getStorageProvider,
  buildCaseDir,
  ensureDir,
  buildRelativePath,
  absoluteFromRelative,
};
