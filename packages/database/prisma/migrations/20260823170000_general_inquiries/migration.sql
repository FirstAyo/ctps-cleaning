CREATE TYPE "GeneralInquiryStatus" AS ENUM ('NEW', 'READ');

CREATE TABLE "GeneralInquiry" (
    "id" UUID NOT NULL,
    "idempotencyKeyHash" CHAR(64) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "phone" VARCHAR(32),
    "serviceKey" VARCHAR(64),
    "message" VARCHAR(3000) NOT NULL,
    "status" "GeneralInquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "GeneralInquiry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EmailOutbox" ADD COLUMN "generalInquiryId" UUID;

CREATE UNIQUE INDEX "GeneralInquiry_idempotencyKeyHash_key" ON "GeneralInquiry"("idempotencyKeyHash");
CREATE INDEX "GeneralInquiry_status_createdAt_idx" ON "GeneralInquiry"("status", "createdAt" DESC);
CREATE INDEX "GeneralInquiry_email_idx" ON "GeneralInquiry"("email");
CREATE INDEX "GeneralInquiry_archivedAt_idx" ON "GeneralInquiry"("archivedAt");
CREATE INDEX "EmailOutbox_generalInquiryId_idx" ON "EmailOutbox"("generalInquiryId");

ALTER TABLE "EmailOutbox"
ADD CONSTRAINT "EmailOutbox_generalInquiryId_fkey"
FOREIGN KEY ("generalInquiryId") REFERENCES "GeneralInquiry"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
