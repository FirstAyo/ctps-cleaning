import { PolicyFoundation } from "@/components/public-pages";
import { noIndexFollowMetadata } from "@/lib/seo";

export const metadata = noIndexFollowMetadata(
  "Accessibility",
  "Accessibility statement foundation requiring review and verified contact details.",
);
export default function Page() {
  return (
    <PolicyFoundation
      title="Accessibility foundation"
      summary="CTPS aims to provide a keyboard-accessible, responsive, readable website with clear status and reduced-motion support."
      sections={[
        {
          title: "Implemented approach",
          body: "The interface uses semantic landmarks, visible focus, labelled controls, keyboard navigation, text alongside colour, responsive reflow, and reduced-motion preferences.",
        },
        {
          title: "Ongoing verification",
          body: "Manual screen-reader, browser, zoom, contrast, and physical-device testing remains part of the release checklist. This page does not claim certification.",
        },
        {
          title: "Feedback channel required",
          body: "A monitored accessibility-feedback contact has not been approved. This foundation is not a final accessibility statement.",
        },
      ]}
    />
  );
}
