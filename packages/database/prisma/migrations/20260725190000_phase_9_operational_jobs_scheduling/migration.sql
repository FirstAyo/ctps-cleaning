-- Phase 9: additive staff-only operational jobs, scheduling, fulfilment, and private media.
CREATE TYPE "ServiceJobStatus" AS ENUM ('DRAFT', 'READY_TO_SCHEDULE', 'SCHEDULED', 'CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'FOLLOW_UP_REQUIRED', 'CANCELLED', 'CLOSED', 'ARCHIVED');
CREATE TYPE "ServiceJobAssignmentRole" AS ENUM ('LEAD', 'CREW_MEMBER', 'COORDINATOR');
CREATE TYPE "ServiceJobChecklistCategory" AS ENUM ('PREPARATION', 'ARRIVAL', 'SERVICE', 'SAFETY', 'CLEANUP', 'COMPLETION');
CREATE TYPE "ServiceJobNoteVisibility" AS ENUM ('INTERNAL', 'CUSTOMER_FACING');
CREATE TYPE "ServiceJobMediaCategory" AS ENUM ('BEFORE', 'DURING', 'AFTER', 'ACCESS', 'ISSUE', 'COMPLETION', 'OTHER');
CREATE TYPE "ServiceJobMediaVariantKind" AS ENUM ('ORIGINAL', 'LARGE', 'STANDARD', 'THUMBNAIL');
CREATE TYPE "ServiceJobIncidentSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "EmailOutbox" ADD COLUMN "deduplicationKey" VARCHAR(160), ADD COLUMN "serviceJobId" UUID, ALTER COLUMN "quoteRequestId" DROP NOT NULL;

CREATE TABLE "ServiceJob" (
  "id" UUID NOT NULL, "referenceNumber" VARCHAR(22) NOT NULL, "quoteRequestId" UUID,
  "status" "ServiceJobStatus" NOT NULL DEFAULT 'DRAFT', "customerType" "QuotePropertyType" NOT NULL,
  "customerNameSnapshot" VARCHAR(120) NOT NULL, "customerEmailSnapshot" VARCHAR(254) NOT NULL,
  "customerPhoneSnapshot" VARCHAR(32) NOT NULL, "companyNameSnapshot" VARCHAR(160),
  "propertyAddressLine1Snapshot" VARCHAR(160) NOT NULL, "propertyAddressLine2Snapshot" VARCHAR(160),
  "citySnapshot" VARCHAR(80) NOT NULL, "serviceAreaKey" VARCHAR(64) NOT NULL,
  "province" VARCHAR(40) NOT NULL DEFAULT 'British Columbia', "postalCodeSnapshot" VARCHAR(16) NOT NULL,
  "propertyTypeSnapshot" VARCHAR(80) NOT NULL, "accessNotes" VARCHAR(3000),
  "serviceScopeSummary" VARCHAR(4000) NOT NULL, "customerSchedulingNotes" VARCHAR(3000),
  "internalOperationalNotes" VARCHAR(5000), "scheduledStartAt" TIMESTAMP(3), "scheduledEndAt" TIMESTAMP(3),
  "estimatedDurationMinutes" INTEGER, "actualArrivalAt" TIMESTAMP(3), "actualStartAt" TIMESTAMP(3),
  "actualEndAt" TIMESTAMP(3), "completionSummary" VARCHAR(4000), "cancellationReason" VARCHAR(1000),
  "followUpRequired" BOOLEAN NOT NULL DEFAULT false, "followUpNotes" VARCHAR(3000),
  "conflictOverrideReason" VARCHAR(1000), "assignedCoordinatorUserId" UUID,
  "createdByUserId" UUID NOT NULL, "updatedByUserId" UUID NOT NULL, "version" INTEGER NOT NULL DEFAULT 1,
  "completedAt" TIMESTAMP(3), "closedAt" TIMESTAMP(3), "archivedAt" TIMESTAMP(3), "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServiceJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ServiceJob_reference_format_check" CHECK ("referenceNumber" ~ '^JOB-[0-9]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{9}$'),
  CONSTRAINT "ServiceJob_bc_province_check" CHECK ("province" = 'British Columbia'),
  CONSTRAINT "ServiceJob_schedule_check" CHECK (("scheduledStartAt" IS NULL AND "scheduledEndAt" IS NULL) OR ("scheduledStartAt" IS NOT NULL AND "scheduledEndAt" > "scheduledStartAt")),
  CONSTRAINT "ServiceJob_duration_check" CHECK ("estimatedDurationMinutes" IS NULL OR "estimatedDurationMinutes" BETWEEN 30 AND 960)
);

CREATE TABLE "ServiceJobService" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "serviceKey" VARCHAR(64) NOT NULL, "scopeSummary" VARCHAR(2000), "sortOrder" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ServiceJobService_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobAssignment" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "userId" UUID NOT NULL, "assignmentRole" "ServiceJobAssignmentRole" NOT NULL, "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "assignedByUserId" UUID NOT NULL, "unassignedAt" TIMESTAMP(3), "notes" VARCHAR(1000), CONSTRAINT "ServiceJobAssignment_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobScheduleHistory" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "previousStartAt" TIMESTAMP(3), "previousEndAt" TIMESTAMP(3), "newStartAt" TIMESTAMP(3) NOT NULL, "newEndAt" TIMESTAMP(3) NOT NULL, "changedByUserId" UUID NOT NULL, "reason" VARCHAR(1000) NOT NULL, "conflictOverridden" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ServiceJobScheduleHistory_pkey" PRIMARY KEY ("id"), CONSTRAINT "ServiceJobScheduleHistory_range_check" CHECK ("newEndAt" > "newStartAt"));
CREATE TABLE "ServiceJobStatusHistory" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "previousStatus" "ServiceJobStatus" NOT NULL, "newStatus" "ServiceJobStatus" NOT NULL, "changedByUserId" UUID NOT NULL, "reason" VARCHAR(1000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ServiceJobStatusHistory_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobNote" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "authorUserId" UUID NOT NULL, "visibility" "ServiceJobNoteVisibility" NOT NULL, "body" VARCHAR(3000) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, "deletedAt" TIMESTAMP(3), CONSTRAINT "ServiceJobNote_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobChecklistItem" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "label" VARCHAR(200) NOT NULL, "description" VARCHAR(1000), "category" "ServiceJobChecklistCategory" NOT NULL, "required" BOOLEAN NOT NULL DEFAULT false, "completed" BOOLEAN NOT NULL DEFAULT false, "completedAt" TIMESTAMP(3), "completedByUserId" UUID, "sortOrder" INTEGER NOT NULL, "notes" VARCHAR(1000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ServiceJobChecklistItem_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobMedia" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "storageKey" VARCHAR(260) NOT NULL, "originalFilename" VARCHAR(255) NOT NULL, "mimeType" VARCHAR(100) NOT NULL, "sizeBytes" INTEGER NOT NULL, "width" INTEGER NOT NULL, "height" INTEGER NOT NULL, "checksum" CHAR(64) NOT NULL, "category" "ServiceJobMediaCategory" NOT NULL, "altText" VARCHAR(300) NOT NULL DEFAULT '', "caption" VARCHAR(500), "sortOrder" INTEGER NOT NULL, "uploadedByUserId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "removedAt" TIMESTAMP(3), CONSTRAINT "ServiceJobMedia_pkey" PRIMARY KEY ("id"), CONSTRAINT "ServiceJobMedia_dimensions_check" CHECK ("width" > 0 AND "height" > 0 AND "sizeBytes" > 0));
CREATE TABLE "ServiceJobMediaVariant" ("id" UUID NOT NULL, "mediaId" UUID NOT NULL, "kind" "ServiceJobMediaVariantKind" NOT NULL, "storageKey" VARCHAR(280) NOT NULL, "mimeType" VARCHAR(100) NOT NULL, "sizeBytes" INTEGER NOT NULL, "width" INTEGER NOT NULL, "height" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ServiceJobMediaVariant_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobIncident" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "title" VARCHAR(200) NOT NULL, "description" VARCHAR(3000) NOT NULL, "severity" "ServiceJobIncidentSeverity" NOT NULL, "blocksCompletion" BOOLEAN NOT NULL DEFAULT false, "reportedByUserId" UUID NOT NULL, "resolvedAt" TIMESTAMP(3), "resolvedByUserId" UUID, "resolutionNotes" VARCHAR(2000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ServiceJobIncident_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ServiceJobActivity" ("id" UUID NOT NULL, "jobId" UUID NOT NULL, "actorUserId" UUID, "action" VARCHAR(100) NOT NULL, "metadata" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ServiceJobActivity_pkey" PRIMARY KEY ("id"));

CREATE UNIQUE INDEX "ServiceJob_referenceNumber_key" ON "ServiceJob"("referenceNumber");
CREATE UNIQUE INDEX "ServiceJob_quoteRequestId_key" ON "ServiceJob"("quoteRequestId");
CREATE INDEX "ServiceJob_status_scheduledStartAt_idx" ON "ServiceJob"("status", "scheduledStartAt");
CREATE INDEX "ServiceJob_scheduledStartAt_scheduledEndAt_idx" ON "ServiceJob"("scheduledStartAt", "scheduledEndAt");
CREATE INDEX "ServiceJob_quoteRequestId_status_idx" ON "ServiceJob"("quoteRequestId", "status");
CREATE INDEX "ServiceJob_serviceAreaKey_scheduledStartAt_idx" ON "ServiceJob"("serviceAreaKey", "scheduledStartAt");
CREATE INDEX "ServiceJob_followUpRequired_status_idx" ON "ServiceJob"("followUpRequired", "status");
CREATE INDEX "ServiceJob_archivedAt_updatedAt_idx" ON "ServiceJob"("archivedAt", "updatedAt" DESC);
CREATE UNIQUE INDEX "ServiceJobService_jobId_serviceKey_key" ON "ServiceJobService"("jobId", "serviceKey");
CREATE UNIQUE INDEX "ServiceJobService_jobId_sortOrder_key" ON "ServiceJobService"("jobId", "sortOrder");
CREATE INDEX "ServiceJobService_serviceKey_jobId_idx" ON "ServiceJobService"("serviceKey", "jobId");
CREATE INDEX "ServiceJobAssignment_jobId_unassignedAt_idx" ON "ServiceJobAssignment"("jobId", "unassignedAt");
CREATE INDEX "ServiceJobAssignment_userId_unassignedAt_idx" ON "ServiceJobAssignment"("userId", "unassignedAt");
CREATE UNIQUE INDEX "ServiceJobAssignment_active_user_key" ON "ServiceJobAssignment"("jobId", "userId") WHERE "unassignedAt" IS NULL;
CREATE UNIQUE INDEX "ServiceJobAssignment_active_lead_key" ON "ServiceJobAssignment"("jobId") WHERE "unassignedAt" IS NULL AND "assignmentRole" = 'LEAD';
CREATE INDEX "ServiceJobScheduleHistory_jobId_createdAt_idx" ON "ServiceJobScheduleHistory"("jobId", "createdAt" DESC);
CREATE INDEX "ServiceJobStatusHistory_jobId_createdAt_idx" ON "ServiceJobStatusHistory"("jobId", "createdAt" DESC);
CREATE INDEX "ServiceJobNote_jobId_visibility_createdAt_idx" ON "ServiceJobNote"("jobId", "visibility", "createdAt" DESC);
CREATE UNIQUE INDEX "ServiceJobChecklistItem_jobId_sortOrder_key" ON "ServiceJobChecklistItem"("jobId", "sortOrder");
CREATE INDEX "ServiceJobChecklistItem_jobId_completed_required_idx" ON "ServiceJobChecklistItem"("jobId", "completed", "required");
CREATE UNIQUE INDEX "ServiceJobMedia_storageKey_key" ON "ServiceJobMedia"("storageKey");
CREATE UNIQUE INDEX "ServiceJobMedia_jobId_sortOrder_key" ON "ServiceJobMedia"("jobId", "sortOrder");
CREATE INDEX "ServiceJobMedia_jobId_category_removedAt_idx" ON "ServiceJobMedia"("jobId", "category", "removedAt");
CREATE UNIQUE INDEX "ServiceJobMediaVariant_storageKey_key" ON "ServiceJobMediaVariant"("storageKey");
CREATE UNIQUE INDEX "ServiceJobMediaVariant_mediaId_kind_key" ON "ServiceJobMediaVariant"("mediaId", "kind");
CREATE INDEX "ServiceJobMediaVariant_mediaId_idx" ON "ServiceJobMediaVariant"("mediaId");
CREATE INDEX "ServiceJobIncident_jobId_blocksCompletion_resolvedAt_idx" ON "ServiceJobIncident"("jobId", "blocksCompletion", "resolvedAt");
CREATE INDEX "ServiceJobActivity_jobId_createdAt_idx" ON "ServiceJobActivity"("jobId", "createdAt" DESC);
CREATE UNIQUE INDEX "EmailOutbox_deduplicationKey_key" ON "EmailOutbox"("deduplicationKey");
CREATE INDEX "EmailOutbox_serviceJobId_createdAt_idx" ON "EmailOutbox"("serviceJobId", "createdAt" DESC);

ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_owner_check" CHECK (num_nonnulls("quoteRequestId", "serviceJobId") = 1);
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_serviceJobId_fkey" FOREIGN KEY ("serviceJobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_assignedCoordinatorUserId_fkey" FOREIGN KEY ("assignedCoordinatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobService" ADD CONSTRAINT "ServiceJobService_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobAssignment" ADD CONSTRAINT "ServiceJobAssignment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobAssignment" ADD CONSTRAINT "ServiceJobAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobAssignment" ADD CONSTRAINT "ServiceJobAssignment_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobScheduleHistory" ADD CONSTRAINT "ServiceJobScheduleHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobScheduleHistory" ADD CONSTRAINT "ServiceJobScheduleHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobStatusHistory" ADD CONSTRAINT "ServiceJobStatusHistory_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobStatusHistory" ADD CONSTRAINT "ServiceJobStatusHistory_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobNote" ADD CONSTRAINT "ServiceJobNote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobNote" ADD CONSTRAINT "ServiceJobNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobChecklistItem" ADD CONSTRAINT "ServiceJobChecklistItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobChecklistItem" ADD CONSTRAINT "ServiceJobChecklistItem_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceJobMedia" ADD CONSTRAINT "ServiceJobMedia_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobMedia" ADD CONSTRAINT "ServiceJobMedia_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobMediaVariant" ADD CONSTRAINT "ServiceJobMediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "ServiceJobMedia"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobIncident" ADD CONSTRAINT "ServiceJobIncident_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobIncident" ADD CONSTRAINT "ServiceJobIncident_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServiceJobIncident" ADD CONSTRAINT "ServiceJobIncident_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ServiceJobActivity" ADD CONSTRAINT "ServiceJobActivity_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ServiceJobActivity" ADD CONSTRAINT "ServiceJobActivity_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
