CREATE TYPE "BlogPostStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "BlogContentFormat" AS ENUM ('STRUCTURED_BLOCKS');
CREATE TYPE "BlogMediaVisibility" AS ENUM ('PRIVATE', 'PUBLIC');
CREATE TYPE "BlogMediaStatus" AS ENUM ('READY', 'ARCHIVED');
CREATE TYPE "BlogMediaVariantKind" AS ENUM ('ORIGINAL', 'FEATURED', 'ARTICLE_LARGE', 'ARTICLE_STANDARD', 'THUMBNAIL');

CREATE TABLE "AuthorProfile" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "displayName" VARCHAR(100) NOT NULL,
  "bio" VARCHAR(1000) NOT NULL DEFAULT '',
  "profileMediaId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthorProfile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPost" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "excerpt" VARCHAR(500) NOT NULL,
  "content" JSONB NOT NULL,
  "searchText" TEXT NOT NULL DEFAULT '',
  "contentFormat" "BlogContentFormat" NOT NULL DEFAULT 'STRUCTURED_BLOCKS',
  "status" "BlogPostStatus" NOT NULL DEFAULT 'DRAFT',
  "authorUserId" UUID NOT NULL,
  "featuredMediaId" UUID,
  "seoTitle" VARCHAR(70),
  "seoDescription" VARCHAR(170),
  "publishedAt" TIMESTAMP(3),
  "scheduledFor" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "readingTimeMinutes" INTEGER NOT NULL DEFAULT 1,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostRevision" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "revisionNumber" INTEGER NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "slug" VARCHAR(120) NOT NULL,
  "excerpt" VARCHAR(500) NOT NULL,
  "content" JSONB NOT NULL,
  "contentFormat" "BlogContentFormat" NOT NULL,
  "statusSnapshot" "BlogPostStatus" NOT NULL,
  "seoTitle" VARCHAR(70),
  "seoDescription" VARCHAR(170),
  "featuredMediaId" UUID,
  "categoryIdsSnapshot" JSONB NOT NULL,
  "tagIdsSnapshot" JSONB NOT NULL,
  "actorUserId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogPostRevision_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogCategory" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "normalizedName" VARCHAR(100) NOT NULL,
  "description" VARCHAR(500) NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogTag" (
  "id" UUID NOT NULL,
  "slug" VARCHAR(100) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "normalizedName" VARCHAR(100) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostCategory" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "categoryId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogPostCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostTag" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "tagId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogPostTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogMediaAsset" (
  "id" UUID NOT NULL,
  "storageKey" VARCHAR(240) NOT NULL,
  "visibility" "BlogMediaVisibility" NOT NULL DEFAULT 'PRIVATE',
  "status" "BlogMediaStatus" NOT NULL DEFAULT 'READY',
  "originalFilename" VARCHAR(255) NOT NULL,
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
  CONSTRAINT "BlogMediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogMediaVariant" (
  "id" UUID NOT NULL,
  "mediaId" UUID NOT NULL,
  "kind" "BlogMediaVariantKind" NOT NULL,
  "storageKey" VARCHAR(260) NOT NULL,
  "mimeType" VARCHAR(100) NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "width" INTEGER NOT NULL,
  "height" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogMediaVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogPostMedia" (
  "id" UUID NOT NULL,
  "postId" UUID NOT NULL,
  "mediaId" UUID NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogPostMedia_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogSlugRedirect" (
  "id" UUID NOT NULL,
  "oldSlug" VARCHAR(120) NOT NULL,
  "postId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlogSlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthorProfile_userId_key" ON "AuthorProfile"("userId");
CREATE UNIQUE INDEX "AuthorProfile_slug_key" ON "AuthorProfile"("slug");
CREATE INDEX "AuthorProfile_profileMediaId_idx" ON "AuthorProfile"("profileMediaId");
CREATE UNIQUE INDEX "BlogPost_slug_key" ON "BlogPost"("slug");
CREATE INDEX "BlogPost_status_publishedAt_idx" ON "BlogPost"("status", "publishedAt" DESC);
CREATE INDEX "BlogPost_status_scheduledFor_idx" ON "BlogPost"("status", "scheduledFor");
CREATE INDEX "BlogPost_authorUserId_status_updatedAt_idx" ON "BlogPost"("authorUserId", "status", "updatedAt" DESC);
CREATE INDEX "BlogPost_featuredMediaId_idx" ON "BlogPost"("featuredMediaId");
CREATE UNIQUE INDEX "BlogPostRevision_postId_revisionNumber_key" ON "BlogPostRevision"("postId", "revisionNumber");
CREATE INDEX "BlogPostRevision_postId_createdAt_idx" ON "BlogPostRevision"("postId", "createdAt" DESC);
CREATE INDEX "BlogPostRevision_actorUserId_idx" ON "BlogPostRevision"("actorUserId");
CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");
CREATE UNIQUE INDEX "BlogCategory_normalizedName_key" ON "BlogCategory"("normalizedName");
CREATE UNIQUE INDEX "BlogTag_slug_key" ON "BlogTag"("slug");
CREATE UNIQUE INDEX "BlogTag_normalizedName_key" ON "BlogTag"("normalizedName");
CREATE UNIQUE INDEX "BlogPostCategory_postId_categoryId_key" ON "BlogPostCategory"("postId", "categoryId");
CREATE INDEX "BlogPostCategory_categoryId_postId_idx" ON "BlogPostCategory"("categoryId", "postId");
CREATE UNIQUE INDEX "BlogPostTag_postId_tagId_key" ON "BlogPostTag"("postId", "tagId");
CREATE INDEX "BlogPostTag_tagId_postId_idx" ON "BlogPostTag"("tagId", "postId");
CREATE UNIQUE INDEX "BlogMediaAsset_storageKey_key" ON "BlogMediaAsset"("storageKey");
CREATE INDEX "BlogMediaAsset_uploadedByUserId_visibility_createdAt_idx" ON "BlogMediaAsset"("uploadedByUserId", "visibility", "createdAt" DESC);
CREATE INDEX "BlogMediaAsset_visibility_status_idx" ON "BlogMediaAsset"("visibility", "status");
CREATE INDEX "BlogMediaAsset_checksum_idx" ON "BlogMediaAsset"("checksum");
CREATE UNIQUE INDEX "BlogMediaVariant_storageKey_key" ON "BlogMediaVariant"("storageKey");
CREATE UNIQUE INDEX "BlogMediaVariant_mediaId_kind_key" ON "BlogMediaVariant"("mediaId", "kind");
CREATE INDEX "BlogMediaVariant_mediaId_idx" ON "BlogMediaVariant"("mediaId");
CREATE UNIQUE INDEX "BlogPostMedia_postId_mediaId_key" ON "BlogPostMedia"("postId", "mediaId");
CREATE UNIQUE INDEX "BlogPostMedia_postId_sortOrder_key" ON "BlogPostMedia"("postId", "sortOrder");
CREATE INDEX "BlogPostMedia_mediaId_idx" ON "BlogPostMedia"("mediaId");
CREATE UNIQUE INDEX "BlogSlugRedirect_oldSlug_key" ON "BlogSlugRedirect"("oldSlug");
CREATE INDEX "BlogSlugRedirect_postId_idx" ON "BlogSlugRedirect"("postId");

ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuthorProfile" ADD CONSTRAINT "AuthorProfile_profileMediaId_fkey" FOREIGN KEY ("profileMediaId") REFERENCES "BlogMediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_featuredMediaId_fkey" FOREIGN KEY ("featuredMediaId") REFERENCES "BlogMediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPostRevision" ADD CONSTRAINT "BlogPostRevision_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostRevision" ADD CONSTRAINT "BlogPostRevision_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPostCategory" ADD CONSTRAINT "BlogPostCategory_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostCategory" ADD CONSTRAINT "BlogPostCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostTag" ADD CONSTRAINT "BlogPostTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "BlogTag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogMediaAsset" ADD CONSTRAINT "BlogMediaAsset_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogMediaVariant" ADD CONSTRAINT "BlogMediaVariant_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "BlogMediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostMedia" ADD CONSTRAINT "BlogPostMedia_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostMedia" ADD CONSTRAINT "BlogPostMedia_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "BlogMediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogSlugRedirect" ADD CONSTRAINT "BlogSlugRedirect_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_schedule_check" CHECK (("status" = 'SCHEDULED' AND "scheduledFor" IS NOT NULL) OR "status" <> 'SCHEDULED');
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_reading_time_check" CHECK ("readingTimeMinutes" >= 1);
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_version_check" CHECK ("version" >= 1);
ALTER TABLE "BlogPostRevision" ADD CONSTRAINT "BlogPostRevision_number_check" CHECK ("revisionNumber" >= 1);
ALTER TABLE "BlogPostMedia" ADD CONSTRAINT "BlogPostMedia_sort_order_check" CHECK ("sortOrder" >= 0);
ALTER TABLE "BlogMediaAsset" ADD CONSTRAINT "BlogMediaAsset_dimensions_check" CHECK ("sizeBytes" > 0 AND "width" > 0 AND "height" > 0);
