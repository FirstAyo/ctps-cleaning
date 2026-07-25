-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MediaVariantKind" AS ENUM ('ORIGINAL', 'LARGE', 'GALLERY', 'THUMBNAIL');

-- CreateEnum
CREATE TYPE "BeforeAfterProjectStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BeforeAfterMediaCategory" AS ENUM ('BEFORE', 'AFTER', 'GALLERY');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "storageKey" VARCHAR(240) NOT NULL,
    "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "MediaStatus" NOT NULL DEFAULT 'READY',
    "originalFilename" VARCHAR(255) NOT NULL,
    "storedFilename" VARCHAR(100) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "altText" VARCHAR(300) NOT NULL DEFAULT '',
    "caption" VARCHAR(500),
    "checksum" CHAR(64) NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaVariant" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "kind" "MediaVariantKind" NOT NULL,
    "storageKey" VARCHAR(260) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeforeAfterProject" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "BeforeAfterProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "serviceKey" VARCHAR(64) NOT NULL,
    "serviceAreaKey" VARCHAR(64) NOT NULL,
    "primaryBeforeMediaId" UUID,
    "primaryAfterMediaId" UUID,
    "seoTitle" VARCHAR(70),
    "seoDescription" VARCHAR(170),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "BeforeAfterProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeforeAfterProjectMedia" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "category" "BeforeAfterMediaCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "caption" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeforeAfterProjectMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_visibility_status_idx" ON "MediaAsset"("visibility", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_uploadedByUserId_createdAt_idx" ON "MediaAsset"("uploadedByUserId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_storageKey_key" ON "MediaVariant"("storageKey");

-- CreateIndex
CREATE INDEX "MediaVariant_mediaId_idx" ON "MediaVariant"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaVariant_mediaId_kind_key" ON "MediaVariant"("mediaId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "BeforeAfterProject_slug_key" ON "BeforeAfterProject"("slug");

-- CreateIndex
CREATE INDEX "BeforeAfterProject_status_publishedAt_idx" ON "BeforeAfterProject"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "BeforeAfterProject_featured_status_displayOrder_idx" ON "BeforeAfterProject"("featured", "status", "displayOrder");

-- CreateIndex
CREATE INDEX "BeforeAfterProject_serviceKey_status_idx" ON "BeforeAfterProject"("serviceKey", "status");

-- CreateIndex
CREATE INDEX "BeforeAfterProject_serviceAreaKey_status_idx" ON "BeforeAfterProject"("serviceAreaKey", "status");

-- CreateIndex
CREATE INDEX "BeforeAfterProject_primaryBeforeMediaId_idx" ON "BeforeAfterProject"("primaryBeforeMediaId");

-- CreateIndex
CREATE INDEX "BeforeAfterProject_primaryAfterMediaId_idx" ON "BeforeAfterProject"("primaryAfterMediaId");

-- CreateIndex
CREATE INDEX "BeforeAfterProjectMedia_mediaId_idx" ON "BeforeAfterProjectMedia"("mediaId");

-- CreateIndex
CREATE INDEX "BeforeAfterProjectMedia_projectId_category_sortOrder_idx" ON "BeforeAfterProjectMedia"("projectId", "category", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "BeforeAfterProjectMedia_projectId_mediaId_key" ON "BeforeAfterProjectMedia"("projectId", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "BeforeAfterProjectMedia_projectId_sortOrder_key" ON "BeforeAfterProjectMedia"("projectId", "sortOrder");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaVariant" ADD CONSTRAINT "MediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProject" ADD CONSTRAINT "BeforeAfterProject_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProject" ADD CONSTRAINT "BeforeAfterProject_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProject" ADD CONSTRAINT "BeforeAfterProject_primaryBeforeMediaId_fkey" FOREIGN KEY ("primaryBeforeMediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProject" ADD CONSTRAINT "BeforeAfterProject_primaryAfterMediaId_fkey" FOREIGN KEY ("primaryAfterMediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProjectMedia" ADD CONSTRAINT "BeforeAfterProjectMedia_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "BeforeAfterProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeforeAfterProjectMedia" ADD CONSTRAINT "BeforeAfterProjectMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
