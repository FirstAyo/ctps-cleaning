import { PolicyFoundation } from "@/components/public-pages";
import { metadataFor } from "@/lib/seo";

export const metadata = metadataFor(
  "Terms",
  "Service-terms foundation requiring CTPS and legal review.",
  "/terms",
);
export default function Page() {
  return (
    <PolicyFoundation
      title="Terms foundation"
      summary="Important distinctions between information, estimates, quote requests, and confirmed service."
      sections={[
        {
          title: "Informational website",
          body: "Public content describes available service categories and service areas using approved information. It does not create a service contract.",
        },
        {
          title: "Estimates and quotes",
          body: "Estimator results are preliminary and non-binding. A quote request confirms receipt only; CTPS reviews scope and communicates any formal quote separately.",
        },
        {
          title: "Appointments and payment",
          body: "The website does not provide public booking, live availability, online payment, invoicing, or customer self-service scheduling.",
        },
        {
          title: "Final terms required",
          body: "Cancellation, service, warranty, limitation, dispute, and jurisdiction terms must be supplied and approved by CTPS and legal counsel before launch.",
        },
      ]}
    />
  );
}
