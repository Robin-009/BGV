-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINATOR', 'MANAGER', 'FIELD_EXECUTIVE', 'QUALITY_CONTROL');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('DRIVER_BGV', 'EMBASSY_BGV');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('CREATED', 'OCR_PENDING', 'OCR_IN_PROGRESS', 'OCR_COMPLETED', 'FIELD_ASSIGNED', 'FIELD_IN_PROGRESS', 'FIELD_SUBMITTED', 'UNDER_REVIEW', 'REPORT_DRAFT', 'QC_PENDING', 'QC_COMPLETED', 'REPORT_APPROVED', 'FINAL', 'REJECTED', 'ERROR', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicableCaseType" AS ENUM ('DRIVER_BGV', 'EMBASSY_BGV', 'BOTH');

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('OCR_EXTRACTED', 'FIELD_VERIFIED', 'COORDINATOR_MANUAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FieldDataType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'PHONE', 'EMAIL', 'ADDRESS', 'BOOLEAN', 'JSON');

-- CreateEnum
CREATE TYPE "MatchMode" AS ENUM ('EXACT', 'FUZZY', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('GREEN', 'AMBER', 'RED', 'UNVERIFIED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('STARTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FileKind" AS ENUM ('ORIGINAL_PDF', 'OCR_TEXT', 'STRUCTURED_JSON', 'EXCEL_EXPORT', 'EVIDENCE_DOCUMENT', 'EVIDENCE_PHOTO', 'EVIDENCE_VIDEO', 'REPORT_PDF', 'CONSENT_DOCUMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3', 'EBS');

-- CreateEnum
CREATE TYPE "OCRStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('NOTE', 'DOCUMENT', 'PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'REVIEW', 'QC_PENDING', 'QC_PASSED', 'QC_REJECTED', 'APPROVED', 'FINAL', 'REJECTED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ReportEventType" AS ENUM ('GENERATED', 'SENT_FOR_REVIEW', 'REVIEWED', 'SENT_FOR_QC', 'QC_PASSED', 'QC_REJECTED', 'APPROVED', 'FINALIZED', 'REJECTED', 'DOWNLOADED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('RED_VERIFICATION_FLAG', 'TAT_WARNING', 'TAT_BREACH', 'FIELD_SUBMISSION_PENDING_REVIEW', 'REPORT_DRAFT_PENDING_APPROVAL', 'QC_PENDING', 'OCR_FAILED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "TatStatus" AS ENUM ('ON_TRACK', 'AT_RISK', 'BREACHED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('BGV_CONSENT', 'DATA_PROCESSING_CONSENT', 'DOCUMENT_UPLOAD_CONSENT');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'OBTAINED', 'REVOKED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "DataPrincipalRequestType" AS ENUM ('ACCESS', 'CORRECTION', 'ERASURE', 'WITHDRAW_CONSENT');

-- CreateEnum
CREATE TYPE "DataPrincipalRequestStatus" AS ENUM ('RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RetentionActionType" AS ENUM ('DELETE_CASE_DATA', 'DELETE_FILES', 'ANONYMIZE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "RetentionActionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "designation" TEXT,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "full_name" TEXT,
    "contact_no" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "candidate_profile_id" UUID,
    "case_number" TEXT NOT NULL,
    "case_type" "CaseType" NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'CREATED',
    "created_by" UUID NOT NULL,
    "assigned_coordinator" UUID,
    "ocr_completed_at" TIMESTAMP(3),
    "field_submitted_at" TIMESTAMP(3),
    "report_approved_at" TIMESTAMP(3),
    "tat_warning_at" TIMESTAMP(3),
    "tat_due_at" TIMESTAMP(3),
    "retention_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_status_history" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "old_status" "CaseStatus",
    "new_status" "CaseStatus" NOT NULL,
    "changed_by" UUID,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_categories" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "applicable_case_type" "ApplicableCaseType" NOT NULL DEFAULT 'BOTH',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_fields" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data_type" "FieldDataType" NOT NULL DEFAULT 'TEXT',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_ocr_extractable" BOOLEAN NOT NULL DEFAULT true,
    "is_manual_entry_only" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_thresholds" (
    "id" UUID NOT NULL,
    "category_id" UUID,
    "field_id" UUID,
    "match_mode" "MatchMode" NOT NULL DEFAULT 'FUZZY',
    "green_score" DOUBLE PRECISION NOT NULL DEFAULT 0.90,
    "amber_score" DOUBLE PRECISION NOT NULL DEFAULT 0.70,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_thresholds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_files" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "uploaded_by" UUID,
    "file_kind" "FileKind" NOT NULL,
    "storage_provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "file_size_kb" INTEGER,
    "checksum" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocr_jobs" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "input_file_id" UUID,
    "provider" TEXT NOT NULL DEFAULT 'MISTRAL',
    "status" "OCRStatus" NOT NULL DEFAULT 'PENDING',
    "pages_processed" INTEGER,
    "raw_text" TEXT,
    "structured_json" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocr_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_data_values" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "source" "DataSource" NOT NULL,
    "value" TEXT,
    "normalized_value" TEXT,
    "confidence_score" DOUBLE PRECISION,
    "ocr_job_id" UUID,
    "field_visit_id" UUID,
    "created_by" UUID,
    "is_manually_edited" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_data_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_assignments" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "field_exec_id" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "remarks" TEXT,

    CONSTRAINT "field_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_visits" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "field_assignment_id" UUID NOT NULL,
    "visit_number" INTEGER NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'STARTED',
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "gps_accuracy_meters" DECIMAL(8,2),
    "notes" TEXT,
    "started_at" TIMESTAMP(3),
    "visited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),

    CONSTRAINT "field_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_files" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "field_visit_id" UUID,
    "uploaded_by" UUID,
    "evidence_type" "EvidenceType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT,
    "file_size_kb" INTEGER,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "notes" TEXT,
    "metadata" JSONB,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_results" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "field_id" UUID NOT NULL,
    "ocr_data_value_id" UUID,
    "field_data_value_id" UUID,
    "ocr_value" TEXT,
    "field_value" TEXT,
    "normalized_ocr_value" TEXT,
    "normalized_field_value" TEXT,
    "similarity_score" DOUBLE PRECISION,
    "auto_status" "VerificationStatus" NOT NULL,
    "final_status" "VerificationStatus" NOT NULL,
    "overridden_by" UUID,
    "override_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comparison_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "file_id" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "requires_qc" BOOLEAN NOT NULL DEFAULT false,
    "generated_by" UUID,
    "reviewed_by" UUID,
    "approved_by" UUID,
    "qc_by" UUID,
    "coordinator_remarks" TEXT,
    "manager_remarks" TEXT,
    "qc_remarks" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "finalized_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_events" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "event_type" "ReportEventType" NOT NULL,
    "from_status" "ReportStatus",
    "to_status" "ReportStatus",
    "performed_by" UUID,
    "remarks" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "case_id" UUID,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "assigned_to" UUID,
    "resolved_by" UUID,
    "due_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tat_snapshots" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "elapsed_days" INTEGER NOT NULL,
    "tat_status" "TatStatus" NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tat_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_records" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "candidate_profile_id" UUID,
    "case_id" UUID,
    "consent_file_id" UUID,
    "consent_type" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "captured_by" UUID,
    "captured_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consent_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_principal_requests" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "candidate_profile_id" UUID,
    "case_id" UUID,
    "request_type" "DataPrincipalRequestType" NOT NULL,
    "status" "DataPrincipalRequestStatus" NOT NULL DEFAULT 'RECEIVED',
    "requester_name" TEXT,
    "requester_contact" TEXT,
    "request_details" TEXT,
    "response_notes" TEXT,
    "processed_by" UUID,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "data_principal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "case_type" "CaseType",
    "retention_days" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_actions" (
    "id" UUID NOT NULL,
    "case_id" UUID NOT NULL,
    "policy_id" UUID,
    "action_type" "RetentionActionType" NOT NULL,
    "status" "RetentionActionStatus" NOT NULL DEFAULT 'PENDING',
    "executed_by" UUID,
    "executed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retention_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "user_id" UUID,
    "case_id" UUID,
    "action" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenant_id_idx" ON "users"("tenant_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "candidate_profiles_tenant_id_idx" ON "candidate_profiles"("tenant_id");

-- CreateIndex
CREATE INDEX "candidate_profiles_full_name_idx" ON "candidate_profiles"("full_name");

-- CreateIndex
CREATE INDEX "candidate_profiles_contact_no_idx" ON "candidate_profiles"("contact_no");

-- CreateIndex
CREATE UNIQUE INDEX "cases_case_number_key" ON "cases"("case_number");

-- CreateIndex
CREATE INDEX "cases_tenant_id_idx" ON "cases"("tenant_id");

-- CreateIndex
CREATE INDEX "cases_case_type_idx" ON "cases"("case_type");

-- CreateIndex
CREATE INDEX "cases_status_idx" ON "cases"("status");

-- CreateIndex
CREATE INDEX "cases_created_at_idx" ON "cases"("created_at");

-- CreateIndex
CREATE INDEX "case_status_history_case_id_idx" ON "case_status_history"("case_id");

-- CreateIndex
CREATE INDEX "data_categories_tenant_id_idx" ON "data_categories"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "data_categories_tenant_id_code_applicable_case_type_key" ON "data_categories"("tenant_id", "code", "applicable_case_type");

-- CreateIndex
CREATE INDEX "verification_fields_category_id_idx" ON "verification_fields"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_fields_category_id_code_key" ON "verification_fields"("category_id", "code");

-- CreateIndex
CREATE INDEX "match_thresholds_category_id_idx" ON "match_thresholds"("category_id");

-- CreateIndex
CREATE INDEX "match_thresholds_field_id_idx" ON "match_thresholds"("field_id");

-- CreateIndex
CREATE INDEX "case_files_case_id_idx" ON "case_files"("case_id");

-- CreateIndex
CREATE INDEX "case_files_file_kind_idx" ON "case_files"("file_kind");

-- CreateIndex
CREATE INDEX "ocr_jobs_case_id_idx" ON "ocr_jobs"("case_id");

-- CreateIndex
CREATE INDEX "ocr_jobs_status_idx" ON "ocr_jobs"("status");

-- CreateIndex
CREATE INDEX "case_data_values_case_id_idx" ON "case_data_values"("case_id");

-- CreateIndex
CREATE INDEX "case_data_values_category_id_idx" ON "case_data_values"("category_id");

-- CreateIndex
CREATE INDEX "case_data_values_field_id_idx" ON "case_data_values"("field_id");

-- CreateIndex
CREATE INDEX "case_data_values_source_idx" ON "case_data_values"("source");

-- CreateIndex
CREATE INDEX "field_assignments_case_id_idx" ON "field_assignments"("case_id");

-- CreateIndex
CREATE INDEX "field_assignments_field_exec_id_idx" ON "field_assignments"("field_exec_id");

-- CreateIndex
CREATE INDEX "field_assignments_status_idx" ON "field_assignments"("status");

-- CreateIndex
CREATE INDEX "field_visits_case_id_idx" ON "field_visits"("case_id");

-- CreateIndex
CREATE INDEX "field_visits_field_assignment_id_idx" ON "field_visits"("field_assignment_id");

-- CreateIndex
CREATE INDEX "evidence_files_case_id_idx" ON "evidence_files"("case_id");

-- CreateIndex
CREATE INDEX "evidence_files_field_visit_id_idx" ON "evidence_files"("field_visit_id");

-- CreateIndex
CREATE INDEX "evidence_files_evidence_type_idx" ON "evidence_files"("evidence_type");

-- CreateIndex
CREATE INDEX "comparison_results_case_id_idx" ON "comparison_results"("case_id");

-- CreateIndex
CREATE INDEX "comparison_results_auto_status_idx" ON "comparison_results"("auto_status");

-- CreateIndex
CREATE INDEX "comparison_results_final_status_idx" ON "comparison_results"("final_status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_file_id_key" ON "reports"("file_id");

-- CreateIndex
CREATE INDEX "reports_case_id_idx" ON "reports"("case_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "reports_case_id_version_key" ON "reports"("case_id", "version");

-- CreateIndex
CREATE INDEX "report_events_report_id_idx" ON "report_events"("report_id");

-- CreateIndex
CREATE INDEX "report_events_case_id_idx" ON "report_events"("case_id");

-- CreateIndex
CREATE INDEX "alerts_tenant_id_idx" ON "alerts"("tenant_id");

-- CreateIndex
CREATE INDEX "alerts_case_id_idx" ON "alerts"("case_id");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_alert_type_idx" ON "alerts"("alert_type");

-- CreateIndex
CREATE INDEX "tat_snapshots_case_id_idx" ON "tat_snapshots"("case_id");

-- CreateIndex
CREATE INDEX "tat_snapshots_tat_status_idx" ON "tat_snapshots"("tat_status");

-- CreateIndex
CREATE INDEX "consent_records_tenant_id_idx" ON "consent_records"("tenant_id");

-- CreateIndex
CREATE INDEX "consent_records_case_id_idx" ON "consent_records"("case_id");

-- CreateIndex
CREATE INDEX "consent_records_status_idx" ON "consent_records"("status");

-- CreateIndex
CREATE INDEX "data_principal_requests_tenant_id_idx" ON "data_principal_requests"("tenant_id");

-- CreateIndex
CREATE INDEX "data_principal_requests_case_id_idx" ON "data_principal_requests"("case_id");

-- CreateIndex
CREATE INDEX "data_principal_requests_status_idx" ON "data_principal_requests"("status");

-- CreateIndex
CREATE INDEX "retention_policies_tenant_id_idx" ON "retention_policies"("tenant_id");

-- CreateIndex
CREATE INDEX "retention_policies_case_type_idx" ON "retention_policies"("case_type");

-- CreateIndex
CREATE INDEX "retention_actions_case_id_idx" ON "retention_actions"("case_id");

-- CreateIndex
CREATE INDEX "retention_actions_status_idx" ON "retention_actions"("status");

-- CreateIndex
CREATE INDEX "audit_logs_tenant_id_idx" ON "audit_logs"("tenant_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_case_id_idx" ON "audit_logs"("case_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_assigned_coordinator_fkey" FOREIGN KEY ("assigned_coordinator") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_categories" ADD CONSTRAINT "data_categories_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_fields" ADD CONSTRAINT "verification_fields_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "data_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_thresholds" ADD CONSTRAINT "match_thresholds_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "data_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_thresholds" ADD CONSTRAINT "match_thresholds_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "verification_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_files" ADD CONSTRAINT "case_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ocr_jobs" ADD CONSTRAINT "ocr_jobs_input_file_id_fkey" FOREIGN KEY ("input_file_id") REFERENCES "case_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "data_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "verification_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_ocr_job_id_fkey" FOREIGN KEY ("ocr_job_id") REFERENCES "ocr_jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_field_visit_id_fkey" FOREIGN KEY ("field_visit_id") REFERENCES "field_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_data_values" ADD CONSTRAINT "case_data_values_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_field_exec_id_fkey" FOREIGN KEY ("field_exec_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_assignments" ADD CONSTRAINT "field_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_field_assignment_id_fkey" FOREIGN KEY ("field_assignment_id") REFERENCES "field_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_field_visit_id_fkey" FOREIGN KEY ("field_visit_id") REFERENCES "field_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_files" ADD CONSTRAINT "evidence_files_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "data_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "verification_fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_ocr_data_value_id_fkey" FOREIGN KEY ("ocr_data_value_id") REFERENCES "case_data_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_field_data_value_id_fkey" FOREIGN KEY ("field_data_value_id") REFERENCES "case_data_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_results" ADD CONSTRAINT "comparison_results_overridden_by_fkey" FOREIGN KEY ("overridden_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "case_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_qc_by_fkey" FOREIGN KEY ("qc_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_events" ADD CONSTRAINT "report_events_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tat_snapshots" ADD CONSTRAINT "tat_snapshots_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_consent_file_id_fkey" FOREIGN KEY ("consent_file_id") REFERENCES "case_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_records" ADD CONSTRAINT "consent_records_captured_by_fkey" FOREIGN KEY ("captured_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_principal_requests" ADD CONSTRAINT "data_principal_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_principal_requests" ADD CONSTRAINT "data_principal_requests_candidate_profile_id_fkey" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_principal_requests" ADD CONSTRAINT "data_principal_requests_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_principal_requests" ADD CONSTRAINT "data_principal_requests_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_policies" ADD CONSTRAINT "retention_policies_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_actions" ADD CONSTRAINT "retention_actions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_actions" ADD CONSTRAINT "retention_actions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "retention_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retention_actions" ADD CONSTRAINT "retention_actions_executed_by_fkey" FOREIGN KEY ("executed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
