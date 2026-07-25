-- CreateEnum
CREATE TYPE "QuoteRequestStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'MORE_INFORMATION_REQUIRED', 'ESTIMATE_REVIEWED', 'QUOTE_PREPARED', 'CONTACTED', 'ACCEPTED', 'DECLINED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuotePropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "QuoteUploadStatus" AS ENUM ('READY', 'REMOVED');

-- CreateEnum
CREATE TYPE "EmailOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "QuoteRequestDraft" (
    "id" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "sourceHash" CHAR(64) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "QuoteRequestDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequest" (
    "id" UUID NOT NULL,
    "reference" VARCHAR(20) NOT NULL,
    "confirmationTokenHash" CHAR(64) NOT NULL,
    "idempotencyKeyHash" CHAR(64) NOT NULL,
    "propertyType" "QuotePropertyType" NOT NULL,
    "services" JSONB NOT NULL,
    "serviceAnswers" JSONB NOT NULL,
    "propertyDetails" JSONB NOT NULL,
    "addressLine1" VARCHAR(160) NOT NULL,
    "addressLine2" VARCHAR(160),
    "city" VARCHAR(80) NOT NULL,
    "province" VARCHAR(40) NOT NULL,
    "postalCode" VARCHAR(16) NOT NULL,
    "serviceAreaKey" VARCHAR(64) NOT NULL,
    "preferredDates" JSONB NOT NULL,
    "notes" VARCHAR(3000),
    "customerName" VARCHAR(120) NOT NULL,
    "customerEmail" VARCHAR(254) NOT NULL,
    "customerPhone" VARCHAR(32) NOT NULL,
    "preferredContactMethod" VARCHAR(16) NOT NULL,
    "companyName" VARCHAR(160),
    "consentAcceptedAt" TIMESTAMP(3) NOT NULL,
    "status" "QuoteRequestStatus" NOT NULL DEFAULT 'NEW',
    "assignedToUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "QuoteRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequestUpload" (
    "id" UUID NOT NULL,
    "draftId" UUID,
    "quoteRequestId" UUID,
    "storageKey" VARCHAR(260) NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "status" "QuoteUploadStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "QuoteRequestUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequestNote" (
    "id" UUID NOT NULL,
    "quoteRequestId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "body" VARCHAR(3000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteRequestStatusHistory" (
    "id" UUID NOT NULL,
    "quoteRequestId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "fromStatus" "QuoteRequestStatus" NOT NULL,
    "toStatus" "QuoteRequestStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteRequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteReferenceCounter" (
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteReferenceCounter_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "PublicRequestThrottle" (
    "keyHash" CHAR(64) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "windowStartedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockedUntil" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicRequestThrottle_pkey" PRIMARY KEY ("keyHash")
);

-- CreateTable
CREATE TABLE "EmailOutbox" (
    "id" UUID NOT NULL,
    "quoteRequestId" UUID NOT NULL,
    "templateKey" VARCHAR(64) NOT NULL,
    "recipient" VARCHAR(254) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "EmailOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" VARCHAR(100),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequestDraft_tokenHash_key" ON "QuoteRequestDraft"("tokenHash");

-- CreateIndex
CREATE INDEX "QuoteRequestDraft_expiresAt_submittedAt_idx" ON "QuoteRequestDraft"("expiresAt", "submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_reference_key" ON "QuoteRequest"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_confirmationTokenHash_key" ON "QuoteRequest"("confirmationTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_idempotencyKeyHash_key" ON "QuoteRequest"("idempotencyKeyHash");

-- CreateIndex
CREATE INDEX "QuoteRequest_status_createdAt_idx" ON "QuoteRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QuoteRequest_assignedToUserId_status_idx" ON "QuoteRequest"("assignedToUserId", "status");

-- CreateIndex
CREATE INDEX "QuoteRequest_customerEmail_idx" ON "QuoteRequest"("customerEmail");

-- CreateIndex
CREATE INDEX "QuoteRequest_archivedAt_idx" ON "QuoteRequest"("archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequestUpload_storageKey_key" ON "QuoteRequestUpload"("storageKey");

-- CreateIndex
CREATE INDEX "QuoteRequestUpload_draftId_status_sortOrder_idx" ON "QuoteRequestUpload"("draftId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteRequestUpload_quoteRequestId_status_sortOrder_idx" ON "QuoteRequestUpload"("quoteRequestId", "status", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteRequestNote_quoteRequestId_createdAt_idx" ON "QuoteRequestNote"("quoteRequestId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "QuoteRequestStatusHistory_quoteRequestId_createdAt_idx" ON "QuoteRequestStatusHistory"("quoteRequestId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PublicRequestThrottle_blockedUntil_idx" ON "PublicRequestThrottle"("blockedUntil");

-- CreateIndex
CREATE INDEX "EmailOutbox_status_createdAt_idx" ON "EmailOutbox"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailOutbox_quoteRequestId_idx" ON "EmailOutbox"("quoteRequestId");

-- AddForeignKey
ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestUpload" ADD CONSTRAINT "QuoteRequestUpload_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "QuoteRequestDraft"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestUpload" ADD CONSTRAINT "QuoteRequestUpload_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestNote" ADD CONSTRAINT "QuoteRequestNote_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestNote" ADD CONSTRAINT "QuoteRequestNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestStatusHistory" ADD CONSTRAINT "QuoteRequestStatusHistory_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteRequestStatusHistory" ADD CONSTRAINT "QuoteRequestStatusHistory_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOutbox" ADD CONSTRAINT "EmailOutbox_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
