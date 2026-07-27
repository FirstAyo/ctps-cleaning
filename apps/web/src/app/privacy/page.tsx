import { PolicyFoundation } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";

export const metadata = metadataFor(
  "Privacy",
  "Privacy-information foundation requiring CTPS and legal review.",
  "/privacy",
);
export default function Page() {
  return (
    <PolicyFoundation
      title="Privacy foundation"
      summary="How the platform handles quote, estimate, media, email, and staff-access information."
      sections={[
        {
          title: "Information collected",
          body: "Quote requests collect the property, service, contact, timing, consent, and optional private-photo information needed for CTPS review. Preliminary estimates store validated service inputs and short-lived opaque access tokens.",
        },
        {
          title: "Access and use",
          body: "Customer and operational records are restricted to authorised staff. Authors do not receive customer access. Private quote and job photos are not published or reused for marketing automatically.",
        },
        {
          title: "Retention and communication",
          body: "CTPS must approve retention periods before production. Email is used for requested workflow messages; submitted information is not a booking, payment, or customer account.",
        },
        {
          title: "Cookies and requests",
          body: "The public site uses only functional browser state where required. Staff administration uses secure session and CSRF controls on the separate protected service.",
        },
      ]}
    />
  );
}
