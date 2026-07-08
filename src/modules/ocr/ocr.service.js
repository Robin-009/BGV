const fs   = require('fs');
const path = require('path');
const prisma = require('../../config/database');
const { NotFoundError } = require('../../utils/errors');

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000';

// Maps frontend display doc-type name → Python service key
const DOC_TYPE_KEY = {
  'Birth Certificate':                  'birth_certificate',
  'Employment Verification':            'employment_certificate',
  'Marriage Certificate':               'marriage',
  'Affidavit Certificate Verification': 'affidavit',
  'Education Certificate Verification': 'education_certificate',
  'Passport':                           'passport',
  'Driving License':                    'driving_licence',
  'Voter ID':                           'voter_id',
  'Aadhaar Card':                       'aadhaar_card',
  'PAN Card':                           'pan_card',
  'Bank Statement':                     'bank_statement',
  'Curriculum Vitae (CV)':              'cv_bgv',
  'Transfer Certificate':               'transfer_certificate',
};

// Maps Python snake_case keys → frontend display field names
const FIELD_LABELS = {
  birth_certificate: {
    child_name_eng:      'Candidate Name',
    child_name_org:      'Name (Regional)',
    gender:              'Gender',
    date_of_birth:       'Date Of Birth',
    place_of_birth:      'Place Of Birth',
    registration_number: 'Registration No.',
    father_name:         "Father's Name",
    mother_name:         "Mother's Name",
    parents_address:     'Address',
  },
  employment_certificate: {
    candidate_name:       'Candidate Name',
    designation:          'Designation',
    employee_id:          'Employee ID',
    company_name:         'Company Name',
    company_address:      'Company Address',
    company_telephone:    'Company Telephone',
    authority_name:       'Issuing Authority',
    period_of_employment: 'Period of Employment',
  },
  marriage: {
    spouse1_name:         'Spouse 1 Name',
    spouse2_name:         'Spouse 2 Name',
    date_of_marriage:     'Date of Marriage',
    place_of_marriage:    'Place of Marriage',
    certificate_number:   'Certificate No.',
    date_of_registration: 'Date of Registration',
    registrar_office:     'Registrar Office',
    office_address:       'Office Address',
    // witnesses → array, handled in mapExtracted
  },
  affidavit: {
    candidate_name:  'Candidate Name',
    registration_no: 'Registration No.',
    notary_name:     'Notary Name',
    date:            'Date',
    place:           'Place',
    subject:         'Subject',
  },
  education_certificate: {
    candidate_name:     'Candidate Name',
    examination_passed: 'Examination Passed',
    roll_no:            'Roll No.',
    institution:        'Institution',
    board_university:   'Board / University',
    year_of_passing:    'Year of Passing',
    percentage_grade:   'Percentage / Grade',
    specialisation:     'Specialisation',
  },
  passport: {
    passport_number: 'Passport No.',
    country_code:    'Country Code',
    nationality:     'Nationality',
    surname:         'Surname',
    given_name:      'Given Name',
    gender:          'Gender',
    date_of_birth:   'Date Of Birth',
    place_of_birth:  'Place of Birth',
    father_name:     "Father's Name",
    mother_name:     "Mother's Name",
    spouse_name:     "Spouse's Name",
    date_of_issue:   'Date of Issue',
    date_of_expiry:  'Date of Expiry',
    place_of_issue:  'Place of Issue',
    file_number:     'File No.',
    address:         'Address',
  },
  driving_licence: {
    candidate_name: 'Candidate Name',
    license_no:     'License No.',
    date_of_birth:  'Date Of Birth',
    father_name:    "Father's Name",
    blood_group:    'Blood Group',
    issue_date:     'Issue Date',
    expiry_date:    'Expiry Date',
    vehicle_class:  'Vehicle Class',
    issuing_rto:    'Issuing RTO',
    address:        'Address',
  },
  voter_id: {
    candidate_name:      'Candidate Name',
    voter_id_no:         'Voter ID No.',
    date_of_birth:       'Date Of Birth',
    gender:              'Gender',
    father_husband_name: "Father's / Husband's Name",
    address:             'Address',
    constituency:        'Constituency',
    part_number:         'Part Number',
  },
  aadhaar_card: {
    candidate_name: 'Candidate Name',
    aadhaar_no:     'Aadhaar No.',
    date_of_birth:  'Date Of Birth',
    gender:         'Gender',
    father_name:    "Father's Name",
    address:        'Address',
    vid:            'VID',
  },
  pan_card: {
    candidate_name: 'Candidate Name',
    pan_no:         'PAN No.',
    date_of_birth:  'Date Of Birth',
    father_name:    "Father's Name",
    entity_type:    'Entity Type',
  },
  bank_statement: {
    account_holder_name: 'Account Holder',
    bank_name:           'Bank Name',
    branch_name:         'Branch',
    account_no:          'Account No.',
    account_type:        'Account Type',
    ifsc_code:           'IFSC Code',
    opening_balance:     'Opening Balance',
    closing_balance:     'Closing Balance',
    // period_from + period_to → combined in mapExtracted
  },
  cv_bgv: {
    full_name:    'Full Name',
    father_name:  "Father's Name",
    mother_name:  "Mother's Name",
    spouse_name:  "Spouse's Name",
    date_of_birth:'Date Of Birth',
    nationality:  'Nationality',
    phone_number: 'Phone Number',
    // criminal_record_declaration → boolean, handled in mapExtracted
    // addresses, references, identity_proofs, court_cases → arrays, handled in mapExtracted
  },
  transfer_certificate: {
    candidate_name: 'Candidate Name',
    father_name:    "Father's Name",
    mother_name:    "Mother's Name",
    date_of_birth:  'Date Of Birth',
    school_name:    'School Name',
    school_address: 'School Address',
    date_of_leaving:'Date of Leaving',
    roll_number:    'Roll / Admission No.',
    reason_leaving: 'Reason for Leaving',
    conduct:        'Conduct',
  },
};

function mapExtracted(docTypeKey, raw) {
  const labelMap = FIELD_LABELS[docTypeKey] || {};
  const out = {};

  // Employment certificate: pipeline returns data nested inside a certificates array
  if (docTypeKey === 'employment_certificate') {
    const certs = Array.isArray(raw.certificates) ? raw.certificates : [raw];
    const cert = certs[0] || {};
    for (const [pyKey, val] of Object.entries(cert)) {
      if (val === null || val === undefined || val === '') continue;
      if (typeof val === 'object') continue;
      const label = labelMap[pyKey];
      if (label) out[label] = val;
    }
    return out;
  }

  for (const [pyKey, val] of Object.entries(raw)) {
    if (val === null || val === undefined || val === '') continue;
    // Skip arrays and objects here — handled separately below
    if (typeof val === 'object') continue;
    const label = labelMap[pyKey];
    if (label) out[label] = val;
  }

  // Combine period_from + period_to for bank statement
  if (docTypeKey === 'bank_statement') {
    const from = raw.period_from || '';
    const to   = raw.period_to   || '';
    if (from || to) out['Statement Period'] = to ? `${from} - ${to}` : from;
  }

  // CV boolean + array fields
  if (docTypeKey === 'cv_bgv') {
    if (raw.criminal_record_declaration !== null && raw.criminal_record_declaration !== undefined) {
      out['Criminal Record Declaration'] = raw.criminal_record_declaration ? 'Yes' : 'No';
    }
    if (Array.isArray(raw.addresses) && raw.addresses.length) out['Addresses'] = raw.addresses;
    if (Array.isArray(raw.references) && raw.references.length) out['References'] = raw.references;
    if (Array.isArray(raw.identity_proofs) && raw.identity_proofs.length) out['Identity Proofs'] = raw.identity_proofs;
    if (Array.isArray(raw.court_cases) && raw.court_cases.length) out['Court Cases'] = raw.court_cases;
  }

  // Marriage witnesses array
  if (docTypeKey === 'marriage') {
    if (Array.isArray(raw.witnesses) && raw.witnesses.length) out['Witnesses'] = raw.witnesses;
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

    // Call Python OCR service — doc_types is a JSON array string as expected by the pipeline
    const blob    = new Blob([fileBuffer], { type: mimeType });
    const form    = new FormData();
    form.append('file', blob, file.fileName);
    form.append('doc_types', JSON.stringify([docTypeKey]));

    let ocrResp;
    try {
      ocrResp = await fetch(`${OCR_SERVICE_URL}/extract`, { method: 'POST', body: form });
    } catch {
      throw new Error(
        `OCR service is not running. Start it with: uvicorn ocr_pipeline.main:app --port 8000`
      );
    }

    if (!ocrResp.ok) {
      const errText = await ocrResp.text();
      throw new Error(`OCR service error ${ocrResp.status}: ${errText}`);
    }

    // Pipeline returns { document_types: [...], extracted_data: { [docTypeKey]: {...} }, raw_ocr_text }
    const ocrData    = await ocrResp.json();
    const rawPayload = ocrData.extracted_data?.[docTypeKey] ?? ocrData.extracted_data ?? {};
    const ocrFields  = mapExtracted(docTypeKey, rawPayload);
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

// Runs OCR for every uploadable file in a case concurrently.
// Returns per-file results so the caller can report partial success.
const runBatchOcr = async (caseId, tenantId) => {
  const bgvCase = await prisma.bgvCase.findFirst({ where: { id: caseId, tenantId } });
  if (!bgvCase) throw new NotFoundError('Case');

  const files = await prisma.caseFile.findMany({
    where: { caseId, fileKind: { notIn: ['OCR_TEXT', 'STRUCTURED_JSON'] } },
  });

  if (files.length === 0) return { processed: 0, succeeded: 0, failed: 0, results: [] };

  const settled = await Promise.allSettled(
    files.map(async (file) => {
      const docTypeDisplay = file.metadata?.docType;
      const result = await runOcr(caseId, file.id, tenantId, docTypeDisplay);
      return {
        fileId:    file.id,
        fileName:  file.originalName || file.fileName,
        docType:   docTypeDisplay,
        status:    'success',
        ocrFields: result.ocrFields,
      };
    })
  );

  const results = settled.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : {
          fileId:   files[i].id,
          fileName: files[i].originalName || files[i].fileName,
          docType:  files[i].metadata?.docType,
          status:   'failed',
          error:    r.reason?.message || 'OCR failed',
        }
  );

  const succeeded = results.filter(r => r.status === 'success').length;
  const failed    = results.filter(r => r.status === 'failed').length;

  return { processed: files.length, succeeded, failed, results };
};

const getOcrJob = async (jobId) => {
  const job = await prisma.oCRJob.findUnique({ where: { id: jobId } });
  if (!job) throw new NotFoundError('OCRJob');
  return job;
};

module.exports = { runOcr, runBatchOcr, getOcrJob, DOC_TYPE_KEY };
