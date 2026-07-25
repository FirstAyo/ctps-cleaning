-- Quote references are generated randomly by the API. The existing unique index remains
-- authoritative; this check preserves the server's uppercase normalization invariant.
ALTER TABLE "QuoteRequest"
ADD CONSTRAINT "QuoteRequest_reference_uppercase_check"
CHECK ("reference" = UPPER("reference"));

-- This table contains allocation state only and is no longer read by the application.
DROP TABLE "QuoteReferenceCounter";
