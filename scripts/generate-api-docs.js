/**
 * BGV Platform — API Documentation Generator
 *
 * Run:  node scripts/generate-api-docs.js
 * Output: ../BGV_Platform_API_Docs.xlsx  (project root)
 *
 * To add a new endpoint: append an entry to the APIS array below,
 * then re-run the script.
 */

const XLSX  = require('xlsx');
const path  = require('path');
const fs    = require('fs');

// ─── Constants used in examples ──────────────────────────────────────────────
const BASE    = 'http://localhost:8000';
const TENANT  = '1c2ff9d4-3fcf-4150-bb65-7778834131d7';
const CASE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const USER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const FILE_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const ASSIGN_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';
const H_TENANT  = `-H "x-tenant-id: ${TENANT}"`;
const H_JSON    = `-H "Content-Type: application/json"`;

const curl = (method, endpoint, body) => {
  const bodyPart = body ? ` -d '${JSON.stringify(body)}'` : '';
  return `curl -X ${method} "${BASE}${endpoint}" ${H_TENANT}${method !== 'GET' && method !== 'DELETE' ? ` ${H_JSON}` : ''}${bodyPart}`;
};

const j = (obj) => JSON.stringify(obj, null, 2);

// ─── API Catalog ─────────────────────────────────────────────────────────────
// Each entry = one row in the Excel sheet.
// Fields: module, method, endpoint, purpose, tenantRequired,
//         queryParams, requestBodySchema, sampleCurl,
//         sampleRequest, sampleResponse, notes, status
const APIS = [

  // ── HEALTH ────────────────────────────────────────────────────────────────
  {
    module: 'Health',
    method: 'GET',
    endpoint: '/health',
    purpose: 'Liveness check — confirms the server is running and reachable.',
    tenantRequired: 'No',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/health"`,
    sampleRequest: '—',
    sampleResponse: j({ status: 'ok', timestamp: '2026-06-21T10:00:00.000Z' }),
    notes: 'Used by load balancers and monitoring dashboards.',
    status: 'Live',
  },

  // ── TENANTS ───────────────────────────────────────────────────────────────
  {
    module: 'Tenants',
    method: 'POST',
    endpoint: '/api/v1/tenants',
    purpose: 'Create a new tenant (organization) on the platform.',
    tenantRequired: 'No',
    queryParams: '—',
    requestBodySchema: 'name: string (2-100)\nslug: string (2-50, lowercase a-z 0-9 -)',
    sampleCurl: curl('POST', '/api/v1/tenants', { name: 'Trudicon India', slug: 'trudicon-india' }),
    sampleRequest: j({ name: 'Trudicon India', slug: 'trudicon-india' }),
    sampleResponse: j({ success: true, data: { id: TENANT, name: 'Trudicon India', slug: 'trudicon-india', status: 'ACTIVE', createdAt: '2026-06-21T10:00:00.000Z' } }),
    notes: 'slug must be unique across all tenants.',
    status: 'Live',
  },
  {
    module: 'Tenants',
    method: 'GET',
    endpoint: '/api/v1/tenants',
    purpose: 'List all tenants with optional search and status filter.',
    tenantRequired: 'No',
    queryParams: 'page (default 1)\nlimit (default 20, max 100)\nstatus: ACTIVE | INACTIVE | SUSPENDED\nsearch: string (matches name)',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/tenants?status=ACTIVE&page=1&limit=10"`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: TENANT, name: 'Trudicon India', slug: 'trudicon-india', status: 'ACTIVE' }], meta: { total: 1, page: 1, limit: 10, totalPages: 1 } }),
    notes: 'Platform-level endpoint — no x-tenant-id required.',
    status: 'Live',
  },
  {
    module: 'Tenants',
    method: 'GET',
    endpoint: '/api/v1/tenants/:id',
    purpose: 'Fetch a single tenant by UUID.',
    tenantRequired: 'No',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/tenants/${TENANT}"`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: TENANT, name: 'Trudicon India', slug: 'trudicon-india', status: 'ACTIVE' } }),
    notes: '404 if tenant not found.',
    status: 'Live',
  },
  {
    module: 'Tenants',
    method: 'PUT',
    endpoint: '/api/v1/tenants/:id',
    purpose: 'Update a tenant\'s name or status.',
    tenantRequired: 'No',
    queryParams: '—',
    requestBodySchema: 'name?: string\nstatus?: ACTIVE | INACTIVE | SUSPENDED',
    sampleCurl: curl('PUT', `/api/v1/tenants/${TENANT}`, { status: 'INACTIVE' }),
    sampleRequest: j({ status: 'INACTIVE' }),
    sampleResponse: j({ success: true, data: { id: TENANT, name: 'Trudicon India', status: 'INACTIVE' } }),
    notes: 'slug cannot be changed after creation.',
    status: 'Live',
  },
  {
    module: 'Tenants',
    method: 'DELETE',
    endpoint: '/api/v1/tenants/:id',
    purpose: 'Hard-delete a tenant and all its cascaded data.',
    tenantRequired: 'No',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl -X DELETE "${BASE}/api/v1/tenants/${TENANT}"`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, message: 'Tenant deleted' }),
    notes: 'DESTRUCTIVE — cascades to users, cases, files. Use only in dev/testing.',
    status: 'Live',
  },

  // ── USERS ─────────────────────────────────────────────────────────────────
  {
    module: 'Users',
    method: 'POST',
    endpoint: '/api/v1/users',
    purpose: 'Create a new user (coordinator, field executive, manager, etc.) within the tenant.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'name: string (2-100)\nemail: string (unique)\npassword: string (min 8)\nrole: ADMIN | COORDINATOR | MANAGER | FIELD_EXECUTIVE | QUALITY_CONTROL\nphone?: string\naddress?: string\ndesignation?: string',
    sampleCurl: curl('POST', '/api/v1/users', { name: 'Priya Mehra', email: 'priya@trudicon.com', password: 'Secure@123', role: 'COORDINATOR', phone: '9876543210', designation: 'Senior Coordinator' }),
    sampleRequest: j({ name: 'Priya Mehra', email: 'priya@trudicon.com', password: 'Secure@123', role: 'COORDINATOR', phone: '9876543210', designation: 'Senior Coordinator' }),
    sampleResponse: j({ success: true, data: { id: USER_ID, name: 'Priya Mehra', email: 'priya@trudicon.com', role: 'COORDINATOR', isActive: true, createdAt: '2026-06-21T10:00:00.000Z' } }),
    notes: 'Password is hashed with bcrypt before storage. Email must be unique globally.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'GET',
    endpoint: '/api/v1/users',
    purpose: 'List users within the tenant. Used by RegisterCasePage to populate coordinator dropdown.',
    tenantRequired: 'Yes',
    queryParams: 'page (default 1)\nlimit (default 20, max 100)\nrole: ADMIN | COORDINATOR | MANAGER | FIELD_EXECUTIVE | QUALITY_CONTROL\nisActive: true | false\nsearch: string (matches name or email)',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/users?role=COORDINATOR&isActive=true&limit=100" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: USER_ID, name: 'Priya Mehra', email: 'priya@trudicon.com', role: 'COORDINATOR', isActive: true }], meta: { total: 1, page: 1, limit: 100 } }),
    notes: 'Frontend uses role=COORDINATOR to populate coordinator autocomplete in RegisterCase.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'GET',
    endpoint: '/api/v1/users/:id',
    purpose: 'Fetch a single user by UUID.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/users/${USER_ID}" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: USER_ID, name: 'Priya Mehra', email: 'priya@trudicon.com', role: 'COORDINATOR', isActive: true } }),
    notes: '404 if user not found or belongs to different tenant.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'GET',
    endpoint: '/api/v1/users/email/:email',
    purpose: 'Lookup a user by email address within the tenant.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/users/email/priya@trudicon.com" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: USER_ID, name: 'Priya Mehra', email: 'priya@trudicon.com', role: 'COORDINATOR' } }),
    notes: 'Used by login flow before JWT is implemented.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'PUT',
    endpoint: '/api/v1/users/:id',
    purpose: 'Update user profile — name, email, role, phone, designation, or isActive flag.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'name?: string\nemail?: string\nrole?: enum\nphone?: string\naddress?: string\ndesignation?: string\nisActive?: boolean',
    sampleCurl: curl('PUT', `/api/v1/users/${USER_ID}`, { designation: 'Lead Coordinator', phone: '9123456789' }),
    sampleRequest: j({ designation: 'Lead Coordinator', phone: '9123456789' }),
    sampleResponse: j({ success: true, data: { id: USER_ID, name: 'Priya Mehra', designation: 'Lead Coordinator', phone: '9123456789' } }),
    notes: 'All fields optional — only provided fields are updated.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'DELETE',
    endpoint: '/api/v1/users/:id',
    purpose: 'Soft-deactivate a user (sets isActive=false). Does not delete records.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl -X DELETE "${BASE}/api/v1/users/${USER_ID}" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: USER_ID, isActive: false } }),
    notes: 'Deactivated users cannot login. Their case history is preserved.',
    status: 'Live',
  },
  {
    module: 'Users',
    method: 'PATCH',
    endpoint: '/api/v1/users/:id/toggle-status',
    purpose: 'Toggle user active/inactive status. Reactivates a deactivated user.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl -X PATCH "${BASE}/api/v1/users/${USER_ID}/toggle-status" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: USER_ID, isActive: true } }),
    notes: 'Toggles the current isActive value.',
    status: 'Live',
  },

  // ── CASES ─────────────────────────────────────────────────────────────────
  {
    module: 'Cases',
    method: 'POST',
    endpoint: '/api/v1/cases',
    purpose: 'Register a new BGV case. Generates caseNumber (TRU-YYYYMMDDHHmmss-NN) and calculates TAT dates automatically.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'candidateName: string (required)\ncaseType: DRIVER_BGV | EMBASSY_BGV_1 | EMBASSY_BGV_2 | CORPORATE_BGV (required)\nclientRefId?: string (A-Z 0-9 -)\nclientName?: string\ninitiationDate?: ISO datetime\nassignedCoordinatorId?: UUID\ncreatedById?: UUID\ntatDueDays?: integer (overrides default)',
    sampleCurl: curl('POST', '/api/v1/cases', { candidateName: 'Rajesh Kumar', clientName: 'Uber India', clientRefId: 'UBR-DEL-401', caseType: 'DRIVER_BGV', assignedCoordinatorId: USER_ID }),
    sampleRequest: j({ candidateName: 'Rajesh Kumar', clientName: 'Uber India', clientRefId: 'UBR-DEL-401', caseType: 'DRIVER_BGV', assignedCoordinatorId: USER_ID }),
    sampleResponse: j({ success: true, data: { id: CASE_ID, caseNumber: 'TRU-20260621100000-01', candidateName: 'Rajesh Kumar', clientName: 'Uber India', clientRefId: 'UBR-DEL-401', caseType: 'DRIVER_BGV', status: 'CREATED', tatWarningAt: '2026-06-24T10:00:00.000Z', tatDueAt: '2026-06-26T10:00:00.000Z', createdAt: '2026-06-21T10:00:00.000Z' } }),
    notes: 'TAT defaults: DRIVER_BGV=3/5d, EMBASSY_BGV_1=5/7d, EMBASSY_BGV_2=7/10d, CORPORATE_BGV=5/7d (warning/due). clientRefId must be unique per tenant.',
    status: 'Live',
  },
  {
    module: 'Cases',
    method: 'GET',
    endpoint: '/api/v1/cases',
    purpose: 'List cases for the tenant with filters. Used by OperationsDashboard, MD Review, Manager Dispatch.',
    tenantRequired: 'Yes',
    queryParams: 'page (default 1)\nlimit (default 20, max 100)\nstatus: CREATED | OCR_PENDING | OCR_IN_PROGRESS | OCR_COMPLETED | FIELD_ASSIGNED | FIELD_IN_PROGRESS | FIELD_SUBMITTED | UNDER_REVIEW | REPORT_DRAFT | QC_PENDING | QC_COMPLETED | REPORT_APPROVED | FINAL | REJECTED | ERROR | ARCHIVED\ncaseType: DRIVER_BGV | EMBASSY_BGV_1 | EMBASSY_BGV_2 | CORPORATE_BGV\nsearch: string (matches caseNumber, clientRefId, candidateName, clientName)\nfromDate: ISO date\ntoDate: ISO date',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/cases?status=UNDER_REVIEW&limit=50" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: CASE_ID, caseNumber: 'TRU-20260621100000-01', candidateName: 'Rajesh Kumar', caseType: 'DRIVER_BGV', status: 'UNDER_REVIEW', tatDueAt: '2026-06-26T10:00:00.000Z', assignedCoordinator: { id: USER_ID, name: 'Priya Mehra' }, _count: { files: 2, ocrJobs: 0 } }], meta: { total: 1, page: 1, limit: 50, totalPages: 1 } }),
    notes: 'Returns coordinator, assignedCoordinator, candidateProfile and file/ocrJob counts in each case object.',
    status: 'Live',
  },
  {
    module: 'Cases',
    method: 'GET',
    endpoint: '/api/v1/cases/:id',
    purpose: 'Fetch a single case by UUID including status history (last 10 events).',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/cases/${CASE_ID}" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: CASE_ID, caseNumber: 'TRU-20260621100000-01', candidateName: 'Rajesh Kumar', status: 'UNDER_REVIEW', statusHistory: [{ oldStatus: 'CREATED', newStatus: 'UNDER_REVIEW', remarks: 'OCR verification completed', createdAt: '2026-06-21T12:00:00.000Z' }] } }),
    notes: 'Includes full statusHistory array (last 10), coordinator, and candidateProfile.',
    status: 'Live',
  },
  {
    module: 'Cases',
    method: 'PUT',
    endpoint: '/api/v1/cases/:id',
    purpose: 'Update case metadata — candidate name, client info, case type, coordinator, initiation date.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'candidateName?: string\nclientRefId?: string\nclientName?: string\ncaseType?: enum\ninitiationDate?: ISO datetime\nassignedCoordinatorId?: UUID',
    sampleCurl: curl('PUT', `/api/v1/cases/${CASE_ID}`, { clientName: 'Uber India Operations', assignedCoordinatorId: USER_ID }),
    sampleRequest: j({ clientName: 'Uber India Operations', assignedCoordinatorId: USER_ID }),
    sampleResponse: j({ success: true, data: { id: CASE_ID, clientName: 'Uber India Operations', assignedCoordinator: { id: USER_ID, name: 'Priya Mehra' } } }),
    notes: 'Does NOT change status — use PATCH /:id/status for that.',
    status: 'Live',
  },
  {
    module: 'Cases',
    method: 'PATCH',
    endpoint: '/api/v1/cases/:id/status',
    purpose: 'Transition case to a new status. Writes a CaseStatusHistory record atomically.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'status: CaseStatus enum (required)\nremarks?: string\nchangedById?: UUID',
    sampleCurl: curl('PATCH', `/api/v1/cases/${CASE_ID}/status`, { status: 'UNDER_REVIEW', remarks: 'OCR verification completed by coordinator' }),
    sampleRequest: j({ status: 'UNDER_REVIEW', remarks: 'OCR verification completed by coordinator' }),
    sampleResponse: j({ success: true, message: 'Case status updated to UNDER_REVIEW', data: { id: CASE_ID, status: 'UNDER_REVIEW', updatedAt: '2026-06-21T12:00:00.000Z' } }),
    notes: 'Status flow: CREATED → UNDER_REVIEW (OCR done) → REPORT_DRAFT (MD sign-off) → FIELD_ASSIGNED (dispatched) → FIELD_SUBMITTED → QC_PENDING → FINAL. Throws 400 if same status.',
    status: 'Live',
  },

  // ── CASE FILES ────────────────────────────────────────────────────────────
  {
    module: 'Case Files',
    method: 'GET',
    endpoint: '/api/v1/cases/:id/files',
    purpose: 'List all files attached to a case. Used by VerifyCasePage to load documents for OCR review.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/cases/${CASE_ID}/files" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: FILE_ID, fileKind: 'ORIGINAL_PDF', fileName: '1719000000000-uuid.pdf', originalName: 'aadhaar_card.pdf', mimeType: 'application/pdf', fileSizeKb: 245, filePath: 'uploads/cases/a1b2.../1719000000000-uuid.pdf', storageProvider: 'LOCAL', createdAt: '2026-06-21T10:05:00.000Z' }] }),
    notes: 'filePath is relative — prefix with / to form the Vite-proxied URL: /uploads/cases/<caseId>/<fileName>',
    status: 'Live',
  },
  {
    module: 'Case Files',
    method: 'POST',
    endpoint: '/api/v1/cases/:id/files',
    purpose: 'Upload one or more documents to a case. Accepts multipart/form-data. Max 10 files, 20 MB each.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'Content-Type: multipart/form-data\nfield name: "files" (multiple)\nAllowed types: application/pdf, image/jpeg, image/png, image/webp\nOptional body fields: fileKind (default ORIGINAL_PDF), uploadedById',
    sampleCurl: `curl -X POST "${BASE}/api/v1/cases/${CASE_ID}/files" ${H_TENANT} -F "files=@aadhaar.pdf" -F "files=@pan_card.jpg"`,
    sampleRequest: 'multipart/form-data — use -F flag in cURL',
    sampleResponse: j({ success: true, message: '2 file(s) uploaded successfully', data: [{ id: FILE_ID, fileKind: 'ORIGINAL_PDF', fileName: '1719000000000-uuid.pdf', originalName: 'aadhaar.pdf', mimeType: 'application/pdf', fileSizeKb: 245, filePath: 'uploads/cases/a1b2.../1719000000000-uuid.pdf' }] }),
    notes: 'Files are saved to uploads/cases/<caseId>/ on local disk (LOCAL provider). Served via /uploads/* static route. S3 swap: change storage.service.js STORAGE_PROVIDER.',
    status: 'Live',
  },
  {
    module: 'Case Files',
    method: 'DELETE',
    endpoint: '/api/v1/cases/:id/files/:fileId',
    purpose: 'Remove a file record from the database. Does NOT delete the physical file from disk/S3.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl -X DELETE "${BASE}/api/v1/cases/${CASE_ID}/files/${FILE_ID}" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, message: 'File removed', data: { id: FILE_ID, deleted: true } }),
    notes: 'Physical file cleanup is a separate retention job (RetentionAction model). 404 if file not found or belongs to different case.',
    status: 'Live',
  },

  // ── FIELD ASSIGNMENTS ─────────────────────────────────────────────────────
  {
    module: 'Field Assignments',
    method: 'POST',
    endpoint: '/api/v1/cases/:caseId/field-assignments',
    purpose: 'Assign a case to a field executive for physical verification. Auto-advances case status to FIELD_ASSIGNED.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'fieldExecId: UUID (must be FIELD_EXECUTIVE role in this tenant)\nassignedById?: UUID\nremarks?: string',
    sampleCurl: curl('POST', `/api/v1/cases/${CASE_ID}/field-assignments`, { fieldExecId: USER_ID, remarks: 'Urgent — embassy deadline 30 Jun' }),
    sampleRequest: j({ fieldExecId: USER_ID, remarks: 'Urgent — embassy deadline 30 Jun' }),
    sampleResponse: j({ success: true, message: 'Field assignment created', data: { id: ASSIGN_ID, status: 'ASSIGNED', assignedAt: '2026-06-21T13:00:00.000Z', case: { id: CASE_ID, caseNumber: 'TRU-20260621100000-01', status: 'FIELD_ASSIGNED' }, fieldExec: { id: USER_ID, name: 'Suresh Field', email: 'suresh@trudicon.com' } } }),
    notes: 'Creates FieldAssignment record + updates BgvCase.status to FIELD_ASSIGNED + writes CaseStatusHistory — all in one DB transaction.',
    status: 'Live',
  },
  {
    module: 'Field Assignments',
    method: 'GET',
    endpoint: '/api/v1/cases/:caseId/field-assignments',
    purpose: 'List all field assignments for a specific case (supports re-assignments and visit history).',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/cases/${CASE_ID}/field-assignments" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: ASSIGN_ID, status: 'ASSIGNED', fieldExec: { id: USER_ID, name: 'Suresh Field' }, visits: [] }] }),
    notes: 'Returns visits array per assignment — useful for tracking re-visits.',
    status: 'Live',
  },
  {
    module: 'Field Assignments',
    method: 'GET',
    endpoint: '/api/v1/field-assignments',
    purpose: 'Global list of field assignments. Used by FieldExecutiveDashboard to show an exec\'s workqueue.',
    tenantRequired: 'Yes',
    queryParams: 'fieldExecId?: UUID (filter by exec)\ncaseId?: UUID\nstatus?: ASSIGNED | IN_PROGRESS | SUBMITTED | UNDER_REVIEW | REJECTED | COMPLETED | CANCELLED\npage (default 1)\nlimit (default 20, max 100)',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/field-assignments?fieldExecId=${USER_ID}&status=ASSIGNED" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: ASSIGN_ID, status: 'ASSIGNED', case: { caseNumber: 'TRU-20260621100000-01', candidateName: 'Rajesh Kumar', caseType: 'DRIVER_BGV', tatDueAt: '2026-06-26T10:00:00.000Z' }, fieldExec: { name: 'Suresh Field' }, visits: [] }], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } }),
    notes: 'Frontend FieldExecutiveDashboard calls this with fieldExecId from the logged-in user\'s session.',
    status: 'Live',
  },
  {
    module: 'Field Assignments',
    method: 'PATCH',
    endpoint: '/api/v1/field-assignments/:id',
    purpose: 'Update assignment status — field exec marks work in progress, submits, or manager rejects.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'status: ASSIGNED | IN_PROGRESS | SUBMITTED | UNDER_REVIEW | REJECTED | COMPLETED | CANCELLED (required)\nremarks?: string',
    sampleCurl: curl('PATCH', `/api/v1/field-assignments/${ASSIGN_ID}`, { status: 'SUBMITTED', remarks: 'Physical visit completed — all documents verified' }),
    sampleRequest: j({ status: 'SUBMITTED', remarks: 'Physical visit completed — all documents verified' }),
    sampleResponse: j({ success: true, message: 'Assignment updated', data: { id: ASSIGN_ID, status: 'SUBMITTED', submittedAt: '2026-06-23T15:00:00.000Z' } }),
    notes: 'Setting status=SUBMITTED auto-fills submittedAt timestamp. Does NOT automatically update BgvCase.status — that is done separately via PATCH /cases/:id/status.',
    status: 'Live',
  },

  // ── FIELD VISITS ──────────────────────────────────────────────────────────
  {
    module: 'Field Visits',
    method: 'POST',
    endpoint: '/api/v1/field-assignments/:assignmentId/visits',
    purpose: 'Start a new field visit for an assignment. Auto-advances assignment to IN_PROGRESS and case to FIELD_IN_PROGRESS (if first visit).',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'gpsLat?: number (-90 to 90)\ngpsLng?: number (-180 to 180)\ngpsAccuracyMeters?: number\nnotes?: string (max 2000)\nstartedAt?: ISO datetime string',
    sampleCurl: curl('POST', `/api/v1/field-assignments/${ASSIGN_ID}/visits`, { gpsLat: 31.5204, gpsLng: 74.3587, notes: 'Reached Birth Registrar office', startedAt: '2026-06-23T09:30:00.000Z' }),
    sampleRequest: j({ gpsLat: 31.5204, gpsLng: 74.3587, notes: 'Reached Birth Registrar office', startedAt: '2026-06-23T09:30:00.000Z' }),
    sampleResponse: j({ success: true, message: 'Field visit started', data: { id: 'fv-uuid', visitNumber: 1, status: 'STARTED', gpsLat: '31.5204000', gpsLng: '74.3587000', notes: 'Reached Birth Registrar office', startedAt: '2026-06-23T09:30:00.000Z', visitedAt: '2026-06-23T09:30:05.000Z', fieldAssignment: { status: 'IN_PROGRESS' } } }),
    notes: 'visitNumber auto-increments per assignment. Each assignment can have multiple visits (re-visits). GPS fields are optional — used for mobile field apps.',
    status: 'Live',
  },
  {
    module: 'Field Visits',
    method: 'GET',
    endpoint: '/api/v1/field-assignments/:assignmentId/visits',
    purpose: 'List all field visits recorded under a specific assignment, in visit-number order.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/field-assignments/${ASSIGN_ID}/visits" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: 'fv-uuid', visitNumber: 1, status: 'COMPLETED', submittedAt: '2026-06-23T14:00:00.000Z', evidenceFiles: [{ id: 'ef-uuid', evidenceType: 'PHOTO', originalName: 'stamp.jpg', mimeType: 'image/jpeg' }] }] }),
    notes: 'Includes evidenceFiles nested — useful for building a summary view of each visit and its evidence.',
    status: 'Live',
  },
  {
    module: 'Field Visits',
    method: 'GET',
    endpoint: '/api/v1/field-visits/:id',
    purpose: 'Get full details of a single field visit including all evidence files.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/field-visits/fv-uuid" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: 'fv-uuid', visitNumber: 1, status: 'COMPLETED', notes: 'Birth Registrar confirmed records', evidenceFiles: [], fieldAssignment: { case: { caseNumber: 'TRU-20260621100000-01', candidateName: 'Rohit Verma' } } } }),
    notes: '404 if visitId does not belong to this tenant.',
    status: 'Live',
  },
  {
    module: 'Field Visits',
    method: 'PATCH',
    endpoint: '/api/v1/field-visits/:id',
    purpose: 'Update a field visit — add GPS, notes, verification answers, or mark as COMPLETED. Completing a visit auto-advances assignment to SUBMITTED and case to FIELD_SUBMITTED.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'status?: STARTED | COMPLETED | CANCELLED\ngpsLat?: number\ngpsLng?: number\ngpsAccuracyMeters?: number\nnotes?: string (max 2000)\nverificationMode?: verbal | physical | both\nverificationStatus?: string\ngroundObservations?: Record<string, string>',
    sampleCurl: curl('PATCH', '/api/v1/field-visits/fv-uuid', { status: 'COMPLETED', notes: 'Registration no. 14 verified in original register', verificationMode: 'physical', verificationStatus: 'Verified — Full Match', groundObservations: { 'Candidate Name': 'Yes', 'Date Of Birth': 'Yes' } }),
    sampleRequest: j({ status: 'COMPLETED', notes: 'Registration no. 14 verified in original register', verificationMode: 'physical', verificationStatus: 'Verified — Full Match', groundObservations: { 'Candidate Name': 'Yes', 'Date Of Birth': 'Yes' } }),
    sampleResponse: j({ success: true, message: 'Field visit updated', data: { id: 'fv-uuid', status: 'COMPLETED', submittedAt: '2026-06-23T14:00:00.000Z', fieldAssignment: { status: 'SUBMITTED' } } }),
    notes: 'status=COMPLETED triggers an atomic transaction: visit.submittedAt set, assignment.status→SUBMITTED, case.status→FIELD_SUBMITTED, CaseStatusHistory written.',
    status: 'Live',
  },
  {
    module: 'Field Visits',
    method: 'POST',
    endpoint: '/api/v1/field-visits/:id/evidence',
    purpose: 'Upload evidence files (photos, PDFs) captured during a field visit. Files are stored at uploads/evidence/:visitId/.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'multipart/form-data\nfiles: File[] (max 20 files, 20 MB each)\nuploadedById?: UUID\nAccepted types: image/jpeg, image/png, image/webp, application/pdf, video/mp4',
    sampleCurl: `curl -X POST "${BASE}/api/v1/field-visits/fv-uuid/evidence" ${H_TENANT} -F "files=@/path/to/stamp.jpg" -F "files=@/path/to/dl_verification.pdf"`,
    sampleRequest: '(multipart/form-data — use -F in curl)',
    sampleResponse: j({ success: true, message: '2 evidence file(s) uploaded', data: [{ id: 'ef-uuid-1', evidenceType: 'PHOTO', originalName: 'stamp.jpg', filePath: 'uploads/evidence/fv-uuid/1750123456-stamp.jpg', mimeType: 'image/jpeg', fileSizeKb: 142 }, { id: 'ef-uuid-2', evidenceType: 'DOCUMENT', originalName: 'dl_verification.pdf', filePath: 'uploads/evidence/fv-uuid/1750123457-dl.pdf', mimeType: 'application/pdf', fileSizeKb: 310 }] }),
    notes: 'EvidenceType is auto-detected: image/* → PHOTO, video/* → VIDEO, else DOCUMENT. Files served at /uploads/evidence/:visitId/:filename via static middleware.',
    status: 'Live',
  },
  {
    module: 'Field Visits',
    method: 'GET',
    endpoint: '/api/v1/field-visits/:id/evidence',
    purpose: 'List all evidence files uploaded for a field visit, ordered newest first.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/field-visits/fv-uuid/evidence" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: 'ef-uuid', evidenceType: 'PHOTO', originalName: 'stamp.jpg', filePath: 'uploads/evidence/fv-uuid/1750123456-stamp.jpg', mimeType: 'image/jpeg', fileSizeKb: 142, uploadedAt: '2026-06-23T14:05:00.000Z' }] }),
    notes: 'Files accessible at /<filePath> through the Vite dev proxy or the backend static server.',
    status: 'Live',
  },

  // ── REPORTS ───────────────────────────────────────────────────────────────
  {
    module: 'Reports',
    method: 'POST',
    endpoint: '/api/v1/reports',
    purpose: 'Create (generate) a BGV report for a case. Supersedes any prior DRAFT. Sets case status → REPORT_DRAFT.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'caseId: uuid (required)\ncoordinatorRemarks: string (optional)\nrequiresQc: boolean (default true)',
    sampleCurl: curl('POST', '/api/v1/reports', { caseId: CASE_ID, requiresQc: true }),
    sampleRequest: j({ caseId: CASE_ID, requiresQc: true }),
    sampleResponse: j({ success: true, data: { id: 'rpt-uuid', version: 1, status: 'DRAFT', caseId: CASE_ID, generatedAt: '2026-06-22T09:00:00.000Z', case: { caseNumber: 'TRU-202606-01', candidateName: 'Rohit Verma', clientName: 'German Embassy', caseType: 'EMBASSY_BGV_1', status: 'REPORT_DRAFT' } } }),
    notes: 'If a DRAFT or QC_REJECTED report already exists for the case, it is superseded (version incremented).',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'GET',
    endpoint: '/api/v1/reports',
    purpose: 'List reports for the tenant. Filter by status or caseId — used by QC Hub to load QC_PENDING queue.',
    tenantRequired: 'Yes',
    queryParams: 'status: comma-separated ReportStatus values (e.g. QC_PENDING,DRAFT)\ncaseId: uuid\npage (default 1)\nlimit (default 20, max 100)',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/reports?status=QC_PENDING" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: [{ id: 'rpt-uuid', version: 1, status: 'QC_PENDING', caseId: CASE_ID, generatedAt: '2026-06-22T09:00:00.000Z', case: { caseNumber: 'TRU-202606-01', candidateName: 'Rohit Verma', clientName: 'German Embassy', caseType: 'EMBASSY_BGV_1' }, generatedBy: { id: USER_ID, name: 'Sneha Kapoor' } }], meta: { total: 1, page: 1, limit: 20, pages: 1 } }),
    notes: 'Ordered by generatedAt desc. Does not include events array.',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'GET',
    endpoint: '/api/v1/reports/:id',
    purpose: 'Fetch a single report with full event history (audit trail of status transitions).',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/reports/rpt-uuid" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: 'rpt-uuid', version: 1, status: 'QC_PENDING', events: [{ eventType: 'GENERATED', fromStatus: null, toStatus: 'DRAFT', createdAt: '2026-06-22T09:00:00.000Z' }, { eventType: 'SENT_FOR_QC', fromStatus: 'DRAFT', toStatus: 'QC_PENDING', createdAt: '2026-06-22T09:30:00.000Z' }] } }),
    notes: 'Events are ordered ascending (oldest first) so the timeline reads top-to-bottom.',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'GET',
    endpoint: '/api/v1/reports/case/:caseId',
    purpose: 'Convenience — fetch the latest report (highest version) for a given case UUID.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: '—',
    sampleCurl: `curl "${BASE}/api/v1/reports/case/${CASE_ID}" ${H_TENANT}`,
    sampleRequest: '—',
    sampleResponse: j({ success: true, data: { id: 'rpt-uuid', version: 2, status: 'DRAFT', caseId: CASE_ID } }),
    notes: '404 if no report exists for the case yet.',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'PATCH',
    endpoint: '/api/v1/reports/:id',
    purpose: 'Update report remarks (coordinator notes, manager notes, QC remarks) without changing status.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'coordinatorRemarks: string (optional)\nmanagerRemarks: string (optional)\nqcRemarks: string (optional)',
    sampleCurl: curl('PATCH', '/api/v1/reports/rpt-uuid', { coordinatorRemarks: 'All checks passed. Ready for QC.' }),
    sampleRequest: j({ coordinatorRemarks: 'All checks passed. Ready for QC.' }),
    sampleResponse: j({ success: true, data: { id: 'rpt-uuid', status: 'DRAFT', coordinatorRemarks: 'All checks passed. Ready for QC.' } }),
    notes: 'Only updates provided fields; others remain unchanged.',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'POST',
    endpoint: '/api/v1/reports/:id/submit-for-qc',
    purpose: 'Submit a DRAFT (or re-submit after QC_REJECTED) report for quality review. Sets report → QC_PENDING, case → QC_PENDING.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'coordinatorRemarks: string (optional)',
    sampleCurl: curl('POST', '/api/v1/reports/rpt-uuid/submit-for-qc', { coordinatorRemarks: 'Verified. Sending for QC.' }),
    sampleRequest: j({ coordinatorRemarks: 'Verified. Sending for QC.' }),
    sampleResponse: j({ success: true, message: 'Report submitted for QC', data: { id: 'rpt-uuid', status: 'QC_PENDING' } }),
    notes: 'Only allowed when report status is DRAFT or QC_REJECTED. Creates a SENT_FOR_QC event.',
    status: 'Live',
  },
  {
    module: 'Reports',
    method: 'POST',
    endpoint: '/api/v1/reports/:id/qc-decision',
    purpose: 'Record the QC Head\'s final decision. APPROVED → case REPORT_APPROVED. REJECTED → case rolls back to REPORT_DRAFT for the writer to revise.',
    tenantRequired: 'Yes',
    queryParams: '—',
    requestBodySchema: 'verdict: "APPROVED" | "REJECTED" (required)\nqcRemarks: string min 1 (required)',
    sampleCurl: curl('POST', '/api/v1/reports/rpt-uuid/qc-decision', { verdict: 'APPROVED', qcRemarks: 'All documents verified clean. Approved.' }),
    sampleRequest: j({ verdict: 'APPROVED', qcRemarks: 'All documents verified clean. Approved.' }),
    sampleResponse: j({ success: true, message: 'QC decision recorded', data: { id: 'rpt-uuid', status: 'QC_PASSED', approvedAt: '2026-06-22T14:00:00.000Z' } }),
    notes: 'Only allowed when report status is QC_PENDING. Creates a QC_PASSED or QC_REJECTED event.',
    status: 'Live',
  },
];

// ─── Column layouts ───────────────────────────────────────────────────────────

// PRIMARY sheet: the three key columns front and centre
const QUICK_COLS = [
  { key: 'module',         header: 'Module',          width: 20  },
  { key: 'method',         header: 'Method',          width: 9   },
  { key: 'endpoint',       header: 'Endpoint',        width: 52  },
  { key: 'purpose',        header: 'Used For',        width: 68  },
  { key: 'sampleCurl',     header: 'Sample cURL',     width: 115 },
  { key: 'sampleResponse', header: 'Sample Response', width: 100 },
  { key: 'notes',          header: 'Notes / Behaviour', width: 58 },
  { key: 'status',         header: 'Status',          width: 10  },
];

// TECHNICAL DETAILS sheet: query params, request body, auth info
const DETAIL_COLS = [
  { key: 'module',            header: 'Module',              width: 20 },
  { key: 'method',            header: 'Method',              width: 9  },
  { key: 'endpoint',          header: 'Endpoint',            width: 52 },
  { key: 'tenantRequired',    header: 'x-tenant-id?',        width: 14 },
  { key: 'queryParams',       header: 'Query Parameters',    width: 55 },
  { key: 'requestBodySchema', header: 'Request Body Schema', width: 60 },
  { key: 'sampleRequest',     header: 'Sample Request (JSON)', width: 60 },
  { key: 'status',            header: 'Status',              width: 10 },
];

// ─── Colour palettes ──────────────────────────────────────────────────────────
const METHOD_COLORS = {
  GET:    { fill: 'D1FAE5', font: '065F46', badge: '16A34A' },
  POST:   { fill: 'DBEAFE', font: '1E40AF', badge: '2563EB' },
  PUT:    { fill: 'FEF3C7', font: '92400E', badge: 'D97706' },
  PATCH:  { fill: 'EDE9FE', font: '4C1D95', badge: '7C3AED' },
  DELETE: { fill: 'FEE2E2', font: '991B1B', badge: 'DC2626' },
};

const MODULE_BG = {
  'Health':            'F0FDF4',
  'Tenants':           'F5F3FF',
  'Users':             'EFF6FF',
  'Cases':             'FFF7ED',
  'Case Files':        'FDF4FF',
  'Field Assignments': 'ECFDF5',
  'Field Visits':      'F0FFF4',
  'Reports':           'FFF1F2',
};

// Key columns that get highlighted treatment
const KEY_COLS = new Set(['purpose', 'sampleCurl', 'sampleResponse']);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const lineCount = (str) => {
  if (!str || str === '—') return 1;
  return String(str).split('\n').length;
};

const rowHeight = (api) => {
  const lines = Math.max(
    lineCount(api.purpose),
    lineCount(api.sampleCurl),
    lineCount(api.sampleResponse),
  );
  return Math.min(Math.max(lines * 13, 55), 420);
};

const makeHeaderStyle = (accentRgb = '4316B1') => ({
  font:      { bold: true, color: { rgb: 'FFFFFF' }, sz: 10 },
  fill:      { patternType: 'solid', fgColor: { rgb: accentRgb } },
  alignment: { wrapText: true, vertical: 'center', horizontal: 'center' },
  border:    { bottom: { style: 'medium', color: { rgb: '7C3AED' } } },
});

const makeCellStyle = (api, colKey) => {
  const mc     = METHOD_COLORS[api.method] || { fill: 'FFFFFF', font: '374151' };
  const modBg  = MODULE_BG[api.module]    || 'FFFFFF';
  const isKey  = KEY_COLS.has(colKey);
  const isMeth = colKey === 'method';
  const isMod  = colKey === 'module';
  const isStat = colKey === 'status';

  let bgColor;
  if (isMeth) bgColor = mc.fill;
  else if (isMod) bgColor = modBg;
  else if (isKey) bgColor = 'FDFCFF';   // very subtle lavender tint for key columns
  else bgColor = 'FFFFFF';

  return {
    font: {
      sz:   isKey ? 9 : 9,
      bold: isMeth || isMod,
      color: { rgb: isMeth ? mc.font : '374151' },
      name: isKey && colKey === 'sampleCurl' ? 'Courier New' : 'Calibri',
    },
    fill:      { patternType: 'solid', fgColor: { rgb: bgColor } },
    alignment: {
      wrapText:   true,
      vertical:   'top',
      horizontal: isMeth || isStat ? 'center' : 'left',
    },
    border: {
      top:    { style: 'thin',   color: { rgb: 'E5E7EB' } },
      bottom: { style: 'thin',   color: { rgb: 'E5E7EB' } },
      left:   { style: isKey ? 'medium' : 'thin', color: { rgb: isKey ? 'C4B5FD' : 'E5E7EB' } },
      right:  { style: isKey ? 'medium' : 'thin', color: { rgb: isKey ? 'C4B5FD' : 'E5E7EB' } },
    },
  };
};

// ─── Sheet builder ────────────────────────────────────────────────────────────
function buildApiSheet(wb, apis, cols, sheetName, accentRgb) {
  const headerRow = cols.map(c => c.header);
  const dataRows  = apis.map(api => cols.map(c => api[c.key] ?? ''));

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  ws['!cols']   = cols.map(c => ({ wch: c.width }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' };
  ws['!rows']   = [{ hpt: 30 }, ...apis.map(api => ({ hpt: rowHeight(api) }))];

  // Header row styles
  headerRow.forEach((_, ci) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c: ci });
    if (!ws[addr]) ws[addr] = { v: headerRow[ci], t: 's' };
    ws[addr].s = makeHeaderStyle(accentRgb);
  });

  // Data cell styles
  apis.forEach((api, ri) => {
    cols.forEach((col, ci) => {
      const addr = XLSX.utils.encode_cell({ r: ri + 1, c: ci });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = makeCellStyle(api, col.key);
    });
  });

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

function buildSheet(apis) {
  const wb      = XLSX.utils.book_new();
  const modules = [...new Set(apis.map(a => a.module))];

  // ── 1. Overview ───────────────────────────────────────────────────────────
  const overviewRows = [
    ['BGV Platform — API Reference', '', '', '', ''],
    [`Generated: ${new Date().toLocaleString('en-IN')}`, '', '', '', ''],
    ['', '', '', '', ''],
    ['Module', 'Endpoint Count', 'HTTP Methods', 'Status', ''],
    ...modules.map(m => {
      const grp     = apis.filter(a => a.module === m);
      const methods = [...new Set(grp.map(a => a.method))].join(' · ');
      return [m, grp.length, methods, 'Live', ''];
    }),
    ['', '', '', '', ''],
    ['TOTAL', apis.length, '', '', ''],
    ['', '', '', '', ''],
    ['Sheets in this workbook:', '', '', '', ''],
    ['  Quick Reference  →  Module | Method | Endpoint | Used For | Sample cURL | Sample Response | Notes', '', '', '', ''],
    ['  Technical Details  →  Module | Method | Endpoint | Auth | Query Params | Request Body | Sample Request', '', '', '', ''],
    ['  Per-module sheets  →  Same as Quick Reference, filtered by module', '', '', '', ''],
  ];
  const wsOv = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOv['!cols'] = [{ wch: 28 }, { wch: 16 }, { wch: 50 }, { wch: 12 }, { wch: 10 }];
  // Style overview header
  ['A1','B1'].forEach(addr => {
    if (wsOv[addr]) wsOv[addr].s = { font: { bold: true, sz: 13, color: { rgb: '4316B1' } } };
  });
  wsOv['A4'] && (wsOv['A4'].s = { font: { bold: true, sz: 10 }, fill: { patternType: 'solid', fgColor: { rgb: 'F5F3FF' } } });
  XLSX.utils.book_append_sheet(wb, wsOv, 'Overview');

  // ── 2. Quick Reference (primary sheet — the three key columns) ────────────
  buildApiSheet(wb, apis, QUICK_COLS, 'Quick Reference', '4316B1');

  // ── 3. Technical Details ──────────────────────────────────────────────────
  buildApiSheet(wb, apis, DETAIL_COLS, 'Technical Details', '0F766E');

  // ── 4. Per-module sheets (Quick Reference format) ─────────────────────────
  modules.forEach(mod => {
    const modApis  = apis.filter(a => a.module === mod);
    const safeName = mod.replace(/[\/\[\]\*\?:]/g, '-').slice(0, 31);
    buildApiSheet(wb, modApis, QUICK_COLS, safeName, '6D28D9');
  });

  return wb;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, '..', '..', 'BGV_Platform_API_Docs.xlsx');
const wb      = buildSheet(APIS);
XLSX.writeFile(wb, outPath);
console.log(`\n✓ API docs written to:\n  ${outPath}`);
console.log(`  ${APIS.length} endpoints  ·  ${[...new Set(APIS.map(a => a.module))].length} modules`);
console.log(`  Sheets: Overview · Quick Reference · Technical Details · per-module\n`);
console.log('To add a new endpoint: append to APIS array, then re-run npm run api-docs\n');
