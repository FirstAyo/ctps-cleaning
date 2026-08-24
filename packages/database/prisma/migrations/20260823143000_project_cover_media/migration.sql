ALTER TABLE "BeforeAfterProject"
ADD COLUMN "coverMediaId" UUID;

CREATE INDEX "BeforeAfterProject_coverMediaId_idx"
ON "BeforeAfterProject"("coverMediaId");

ALTER TABLE "BeforeAfterProject"
ADD CONSTRAINT "BeforeAfterProject_coverMediaId_fkey"
FOREIGN KEY ("coverMediaId") REFERENCES "MediaAsset"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
