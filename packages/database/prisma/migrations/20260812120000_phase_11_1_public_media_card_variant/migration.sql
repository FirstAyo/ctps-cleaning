ALTER TYPE "PublicMediaVariantKind" ADD VALUE IF NOT EXISTS 'CARD';

UPDATE "MarketingPageMedia"
SET "usage" = 'PUBLISHED:LEGACY:0:media:' || "sortOrder"::text
WHERE "usage" = 'DRAFT_CONTENT';
