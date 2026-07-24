import type { Metadata } from "next";

import { PublicDesignSystem } from "@/components/public-design-system";

export const metadata: Metadata = {
  title: "Public Design System | CTPS",
  description: "Development preview of the CTPS Phase 2 public design system.",
};

export default function Page() {
  return <PublicDesignSystem />;
}
