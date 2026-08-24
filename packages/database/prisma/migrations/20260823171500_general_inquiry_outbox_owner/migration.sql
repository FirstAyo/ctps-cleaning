ALTER TABLE "EmailOutbox" DROP CONSTRAINT "EmailOutbox_owner_check";

ALTER TABLE "EmailOutbox"
ADD CONSTRAINT "EmailOutbox_owner_check"
CHECK (num_nonnulls("quoteRequestId", "serviceJobId", "generalInquiryId") = 1);
