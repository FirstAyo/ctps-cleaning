-- CreateEnum
CREATE TYPE "MarketingPageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "PublicMediaStatus" AS ENUM ('READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PublicMediaVariantKind" AS ENUM ('ORIGINAL', 'HERO', 'LARGE', 'STANDARD', 'THUMBNAIL');

-- CreateTable
CREATE TABLE "MarketingPage" (
    "id" UUID NOT NULL,
    "pageKey" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "navigationLabel" VARCHAR(80),
    "pageType" VARCHAR(40) NOT NULL,
    "status" "MarketingPageStatus" NOT NULL DEFAULT 'DRAFT',
    "draftContent" JSONB NOT NULL,
    "publishedContent" JSONB,
    "seoTitle" VARCHAR(70),
    "seoDescription" VARCHAR(170),
    "ogTitle" VARCHAR(70),
    "ogDescription" VARCHAR(170),
    "socialImageId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "publishedRevisionId" UUID,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "publishedByUserId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "MarketingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPageRevision" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "seoSnapshot" JSONB NOT NULL,
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPageRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicMediaAsset" (
    "id" UUID NOT NULL,
    "originalFilename" VARCHAR(255) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "altText" VARCHAR(300) NOT NULL,
    "caption" VARCHAR(500),
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "checksum" CHAR(64) NOT NULL,
    "focalPointX" INTEGER NOT NULL DEFAULT 50,
    "focalPointY" INTEGER NOT NULL DEFAULT 50,
    "status" "PublicMediaStatus" NOT NULL DEFAULT 'READY',
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PublicMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicMediaVariant" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "kind" "PublicMediaVariantKind" NOT NULL,
    "storageKey" VARCHAR(260) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicMediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingPageMedia" (
    "id" UUID NOT NULL,
    "pageId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "usage" VARCHAR(80) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketingPageMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NavigationItem" (
    "id" UUID NOT NULL,
    "systemKey" VARCHAR(80) NOT NULL,
    "label" VARCHAR(80) NOT NULL,
    "href" VARCHAR(200) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NavigationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_pageKey_key" ON "MarketingPage"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_slug_key" ON "MarketingPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPage_publishedRevisionId_key" ON "MarketingPage"("publishedRevisionId");

-- CreateIndex
CREATE INDEX "MarketingPage_status_updatedAt_idx" ON "MarketingPage"("status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "MarketingPage_pageType_status_idx" ON "MarketingPage"("pageType", "status");

-- CreateIndex
CREATE INDEX "MarketingPage_socialImageId_idx" ON "MarketingPage"("socialImageId");

-- CreateIndex
CREATE INDEX "MarketingPageRevision_pageId_createdAt_idx" ON "MarketingPageRevision"("pageId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPageRevision_pageId_revisionNumber_key" ON "MarketingPageRevision"("pageId", "revisionNumber");

-- CreateIndex
CREATE INDEX "PublicMediaAsset_status_createdAt_idx" ON "PublicMediaAsset"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PublicMediaAsset_uploadedByUserId_createdAt_idx" ON "PublicMediaAsset"("uploadedByUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PublicMediaAsset_checksum_idx" ON "PublicMediaAsset"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "PublicMediaVariant_storageKey_key" ON "PublicMediaVariant"("storageKey");

-- CreateIndex
CREATE INDEX "PublicMediaVariant_mediaId_idx" ON "PublicMediaVariant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicMediaVariant_mediaId_kind_key" ON "PublicMediaVariant"("mediaId", "kind");

-- CreateIndex
CREATE INDEX "MarketingPageMedia_mediaId_idx" ON "MarketingPageMedia"("mediaId");

-- CreateIndex
CREATE INDEX "MarketingPageMedia_pageId_usage_sortOrder_idx" ON "MarketingPageMedia"("pageId", "usage", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPageMedia_pageId_mediaId_usage_key" ON "MarketingPageMedia"("pageId", "mediaId", "usage");

-- CreateIndex
CREATE UNIQUE INDEX "NavigationItem_systemKey_key" ON "NavigationItem"("systemKey");

-- CreateIndex
CREATE INDEX "NavigationItem_enabled_sortOrder_idx" ON "NavigationItem"("enabled", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "SiteSetting_key_key" ON "SiteSetting"("key");

-- CreateIndex
CREATE INDEX "SiteSetting_updatedAt_idx" ON "SiteSetting"("updatedAt" DESC);

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_publishedByUserId_fkey" FOREIGN KEY ("publishedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_socialImageId_fkey" FOREIGN KEY ("socialImageId") REFERENCES "PublicMediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPage" ADD CONSTRAINT "MarketingPage_publishedRevisionId_fkey" FOREIGN KEY ("publishedRevisionId") REFERENCES "MarketingPageRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageRevision" ADD CONSTRAINT "MarketingPageRevision_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MarketingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageRevision" ADD CONSTRAINT "MarketingPageRevision_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicMediaAsset" ADD CONSTRAINT "PublicMediaAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicMediaVariant" ADD CONSTRAINT "PublicMediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "PublicMediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageMedia" ADD CONSTRAINT "MarketingPageMedia_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "MarketingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingPageMedia" ADD CONSTRAINT "MarketingPageMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "PublicMediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NavigationItem" ADD CONSTRAINT "NavigationItem_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteSetting" ADD CONSTRAINT "SiteSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
