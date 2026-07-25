CREATE TYPE "PricingVersionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PricingRuleType" AS ENUM ('FIXED_RANGE_ADDITION', 'FIXED_RANGE_REPLACEMENT', 'PER_UNIT_RANGE', 'PERCENTAGE_RANGE_ADJUSTMENT', 'TIER_RANGE', 'MINIMUM_CHARGE', 'SERVICE_AREA_RANGE_ADDITION', 'CUSTOMER_TYPE_RANGE_ADDITION', 'MANUAL_REVIEW');
CREATE TYPE "PricingConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'IN', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'BOOLEAN_TRUE', 'BOOLEAN_FALSE');
CREATE TYPE "EstimateOutcome" AS ENUM ('RANGE', 'MANUAL_REVIEW');
CREATE TYPE "EstimateMatchStatus" AS ENUM ('NOT_LINKED', 'MATCHED', 'INPUTS_CHANGED', 'EXPIRED');

ALTER TABLE "QuoteRequest" ADD COLUMN "estimateMatchStatus" "EstimateMatchStatus" NOT NULL DEFAULT 'NOT_LINKED', ADD COLUMN "estimateResultId" UUID, ADD COLUMN "estimateSnapshot" JSONB;

CREATE TABLE "PricingVersion" (
  "id" UUID NOT NULL, "versionCode" VARCHAR(64) NOT NULL, "name" VARCHAR(160) NOT NULL,
  "status" "PricingVersionStatus" NOT NULL DEFAULT 'DRAFT', "effectiveFrom" TIMESTAMP(3), "effectiveTo" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3), "createdByUserId" UUID NOT NULL, "updatedByUserId" UUID NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1, "notes" VARCHAR(2000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, "archivedAt" TIMESTAMP(3), CONSTRAINT "PricingVersion_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ServicePricingConfiguration" (
  "id" UUID NOT NULL, "pricingVersionId" UUID NOT NULL, "serviceKey" VARCHAR(64) NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true,
  "baseMinimumCents" INTEGER NOT NULL, "baseMaximumCents" INTEGER NOT NULL, "minimumChargeCents" INTEGER NOT NULL,
  "maximumEstimatorCents" INTEGER NOT NULL, "roundingIncrementCents" INTEGER NOT NULL, "displayOrder" INTEGER NOT NULL DEFAULT 0,
  "customerDisclaimer" VARCHAR(1000) NOT NULL, "assumptions" JSONB NOT NULL, "exclusions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ServicePricingConfiguration_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "PricingRule" (
  "id" UUID NOT NULL, "servicePricingConfigurationId" UUID NOT NULL, "ruleKey" VARCHAR(100) NOT NULL,
  "questionKey" VARCHAR(100) NOT NULL, "ruleType" "PricingRuleType" NOT NULL, "conditionOperator" "PricingConditionOperator" NOT NULL,
  "comparisonValue" JSONB, "minimumAdjustmentCents" INTEGER, "maximumAdjustmentCents" INTEGER, "adjustmentBasisPoints" INTEGER,
  "sortOrder" INTEGER NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT true, "publicLabel" VARCHAR(200) NOT NULL,
  "internalDescription" VARCHAR(1000), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PricingRule_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "EstimateResult" (
  "id" UUID NOT NULL, "publicTokenHash" CHAR(64) NOT NULL, "transferTokenHash" CHAR(64), "transferTokenExpiresAt" TIMESTAMP(3),
  "idempotencyKeyHash" CHAR(64) NOT NULL, "inputFingerprint" CHAR(64) NOT NULL, "sourceHash" CHAR(64) NOT NULL,
  "serviceKey" VARCHAR(64) NOT NULL, "customerType" "QuotePropertyType" NOT NULL, "serviceAreaKey" VARCHAR(64) NOT NULL,
  "outcome" "EstimateOutcome" NOT NULL, "minimumCents" INTEGER, "maximumCents" INTEGER, "currency" CHAR(3) NOT NULL DEFAULT 'CAD',
  "pricingVersionId" UUID NOT NULL, "pricingVersionCode" VARCHAR(64) NOT NULL, "normalizedInput" JSONB NOT NULL,
  "publicExplanation" JSONB NOT NULL, "calculationTrace" JSONB NOT NULL, "assumptionsSnapshot" JSONB NOT NULL,
  "exclusionsSnapshot" JSONB NOT NULL, "disclaimerSnapshot" VARCHAR(1000) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL, "archivedAt" TIMESTAMP(3), "convertedAt" TIMESTAMP(3), CONSTRAINT "EstimateResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PricingVersion_versionCode_key" ON "PricingVersion"("versionCode");
CREATE INDEX "PricingVersion_status_effectiveFrom_effectiveTo_idx" ON "PricingVersion"("status", "effectiveFrom", "effectiveTo");
CREATE INDEX "ServicePricingConfiguration_pricingVersionId_displayOrder_idx" ON "ServicePricingConfiguration"("pricingVersionId", "displayOrder");
CREATE UNIQUE INDEX "ServicePricingConfiguration_pricingVersionId_serviceKey_key" ON "ServicePricingConfiguration"("pricingVersionId", "serviceKey");
CREATE INDEX "PricingRule_servicePricingConfigurationId_sortOrder_idx" ON "PricingRule"("servicePricingConfigurationId", "sortOrder");
CREATE UNIQUE INDEX "PricingRule_servicePricingConfigurationId_ruleKey_key" ON "PricingRule"("servicePricingConfigurationId", "ruleKey");
CREATE UNIQUE INDEX "EstimateResult_publicTokenHash_key" ON "EstimateResult"("publicTokenHash");
CREATE UNIQUE INDEX "EstimateResult_transferTokenHash_key" ON "EstimateResult"("transferTokenHash");
CREATE UNIQUE INDEX "EstimateResult_idempotencyKeyHash_key" ON "EstimateResult"("idempotencyKeyHash");
CREATE INDEX "EstimateResult_createdAt_idx" ON "EstimateResult"("createdAt" DESC);
CREATE INDEX "EstimateResult_expiresAt_idx" ON "EstimateResult"("expiresAt");
CREATE INDEX "EstimateResult_pricingVersionId_idx" ON "EstimateResult"("pricingVersionId");
CREATE INDEX "EstimateResult_serviceKey_outcome_idx" ON "EstimateResult"("serviceKey", "outcome");
CREATE UNIQUE INDEX "QuoteRequest_estimateResultId_key" ON "QuoteRequest"("estimateResultId");

ALTER TABLE "QuoteRequest" ADD CONSTRAINT "QuoteRequest_estimateResultId_fkey" FOREIGN KEY ("estimateResultId") REFERENCES "EstimateResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PricingVersion" ADD CONSTRAINT "PricingVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PricingVersion" ADD CONSTRAINT "PricingVersion_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ServicePricingConfiguration" ADD CONSTRAINT "ServicePricingConfiguration_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "PricingVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PricingRule" ADD CONSTRAINT "PricingRule_servicePricingConfigurationId_fkey" FOREIGN KEY ("servicePricingConfigurationId") REFERENCES "ServicePricingConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EstimateResult" ADD CONSTRAINT "EstimateResult_pricingVersionId_fkey" FOREIGN KEY ("pricingVersionId") REFERENCES "PricingVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
