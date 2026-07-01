const fs   = require('fs');
const path = require('path');
const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8001';

// Maps frontend display doc-type name → Python service key
const DOC_TYPE_KEY = {
  'Birth Certificate':                  'birth_certificate',
  'Employment Verification':            'employment_verification',
  'Marriage Certificate':               'marriage_certificate',
  'Affidavit Certificate Verification': 'affidavit',
  'Education Certificate Verification': 'education_certificate',
  'Passport':                           'passport',
  'Driving License':                    'driving_license',
  'Voter ID':                           'voter_id',
  'Aadhaar Card':                       'aadhaar',
  'PAN Card':                           'pan_card',
  'Bank Statement':                     'bank_statement',
};

// Maps Python snake_case keys → frontend display field names
const FIELD_LABELS = {
  birth_certificate: {
    child_name_eng:      'Candidate Name',
    child_name_org:      'Name (Regional)',
    gender_eng:          'Gender',
    date_of_birth_eng:   'Date Of Birth',
    place_of_birth_eng:  'Place Of Birth',
    father_name_eng:     "Father's Name",
    mother_name_eng:     "Mother's Name",
    parents_address_eng: 'Address',
  },
  employment_verification: {
    candidate_name:    'Candidate Name',
    designation:       'Designation',
    organisation_name: 'Organisation Name',
    // period_from + period_to → combined below
  },
  marriage_certificate: {
    candidate_name:    'Candidate Name',
    spouse_name:       "Spouse's Name",
    place_of_marriage: 'Place of Marriage',
    date_of_marriage:  'Date of Marriage',
    registration_no:   'Registration No.',
  },
  affidavit: {
    candidate_name:  'Candidate Name',
    registration_no: 'Registration No.',
    date:            'Date',
  },
  education_certificate: {
    candidate_name:     'Candidate Name',
    examination_passed: 'Examination Passed',
    roll_no:            'Roll No.',
    institution:        'Institution',
    year_of_passing:    'Year of Passing',
  },
  passport: {
    candidate_name: 'Candidate Name',
    passport_no:    'Passport No.',
    date_of_birth:  'Date Of Birth',
    issue_date:     'Issue Date',
    expiry_date:    'Expiry Date',
    nationality:    'Nationality',
  },
  driving_license: {
    candidate_name: 'Candidate Name',
    license_no:     'License No.',
    date_of_birth:  'Date Of Birth',
    issue_date:     'Issue Date',
    expiry_date:    'Expiry Date',
    vehicle_class:  'Vehicle Class',
    address:        'Address',
  },
  voter_id: {
    candidate_name:      'Candidate Name',
    voter_id_no:         'Voter ID No.',
    date_of_birth:       'Date Of Birth',
    father_husband_name: "Father's/Husband's Name",
    address:             'Address',
    constituency:        'Constituency',
  },
  aadhaar: {
    candidate_name: 'Candidate Name',
    aadhaar_no:     'Aadhaar No.',
    date_of_birth:  'Date Of Birth',
    gender:         'Gender',
    address:        'Address',
  },
  pan_card: {
    candidate_name: 'Candidate Name',
    pan_no:         'PAN No.',
    date_of_birth:  'Date Of Birth',
    father_name:    "Father's Name",
  },
  bank_statement: {
    account_holder_name: 'Candidate Name',
    bank_name:           'Bank Name',
    account_no:          'Account No.',
    ifsc_code:           'IFSC Code',
    // period_from + period_to → combined below
  },
};

function mapExtracted(docTypeKey, raw) {
  const labelMap = FIELD_LABELS[docTypeKey] || {};
  const out = {};

  for (const [pyKey, val] of Object.entries(raw)) {
    if (val === null || val === undefined || val === '') continue;
    const label = labelMap[pyKey];
    if (label) out[label] = val;
  }

  // Combine period_from + period_to for employment and bank statement
  if (docTypeKey === 'employment_verification') {
    const from = raw.period_from || '';
    const to   = raw.period_to   || '';
    if (from || to) {
      out['Period of Employment'] = to ? `${from} - ${to}` : from;
    }
  }
  if (docTypeKey === 'bank_statement') {
    const from = raw.period_from || '';
    const to   = raw.period_to   || '';
    if (from || to) out['Statement Period'] = to ? `${from} - ${to}` : from;
  }

  return out;
}

const runOcr = async (caseId, fileId, tenantId, docTypeDisplay) => {
  // Verify case belongs to tenant
  const bgvCase = await prisma.bgvCase.findFirst({ where: { id: caseId, tenantId } });
  if (!bgvCase) throw new NotFoundError('Case');

  const file = await prisma.caseFile.findFirst({ where: { id: fileId, caseId } });
  if (!file) throw new NotFoundError('File');

  const rawType    = docTypeDisplay || file.metadata?.docType;
  const docTypeKey = rawType ? DOC_TYPE_KEY[rawType] : null;
  if (!docTypeKey) {
    const supported = Object.keys(DOC_TYPE_KEY).join(', ');
    throw new Error(
      `Cannot run OCR: document type "${rawType || 'unknown'}" is not supported. ` +
      `Please select one of: ${supported}`
    );
  }

  // Create OCRJob with PENDING status
  const job = await prisma.oCRJob.create({
    data: {
      caseId,
      inputFileId: fileId,
      provider:    'MISTRAL',
      status:      'PENDING',
    },
  });

  try {
    // Mark IN_PROGRESS
    await prisma.oCRJob.update({
      where: { id: job.id },
      data:  { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    // Read file from disk
    const absPath = path.join(process.cwd(), file.filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`File not found on disk: ${file.filePath}`);
    }
    const fileBuffer = fs.readFileSync(absPath);
    const mimeType   = file.mimeType || 'application/pdf';

    // Call Python OCR service
    const blob    = new Blob([fileBuffer], { type: mimeType });
    const form    = new FormData();
    form.append('file', blob, file.fileName);
    form.append('doc_type', docTypeKey);

    let ocrResp;
    try {
      ocrResp = await fetch(`${OCR_SERVICE_URL}/extract`, { method: 'POST', body: form });
    } catch {
      throw new Error(
        `OCR service is not running. Start it with: python bgv_backend/ocr_service/main.py (runs on port 8001)`
      );
    }

    if (!ocrResp.ok) {
      const errText = await ocrResp.text();
      throw new Error(`OCR service error ${ocrResp.status}: ${errText}`);
    }

    const ocrData    = await ocrResp.json();
    const ocrFields  = mapExtracted(docTypeKey, ocrData.extracted_data);
    const rawText    = ocrData.raw_ocr_text || null;

    // Save to OCRJob
    await prisma.oCRJob.update({
      where: { id: job.id },
      data: {
        status:        'COMPLETED',
        rawText,
        structuredJson: ocrData.extracted_data,
        pagesProcessed: (rawText?.split('\n\n').length) || 1,
        completedAt:    new Date(),
      },
    });

    // Save ocrFields to CaseFile.metadata
    const existingMeta = file.metadata || {};
    await prisma.caseFile.update({
      where: { id: fileId },
      data:  {
        metadata: {
          ...existingMeta,
          ocrFields,
          docType: docTypeDisplay || existingMeta.docType || null,
          ocrJobId: job.id,
          savedAt: new Date().toISOString(),
        },
      },
    });

    return { jobId: job.id, docType: docTypeKey, ocrFields, rawText };

  } catch (err) {
    await prisma.oCRJob.update({
      where: { id: job.id },
      data:  { status: 'FAILED', errorMessage: err.message, completedAt: new Date() },
    });
    throw err;
  }
};

const getOcrJob = async (jobId) => {
  const job = await prisma.oCRJob.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundError('OCRJob');
  return job;
};

module.exports = { runOcr, getOcrJob, DOC_TYPE_KEY };
