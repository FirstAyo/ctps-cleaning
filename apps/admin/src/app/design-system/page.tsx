import type { Metadata } from "next";

import { AdminDesignSystem } from "@/components/admin-design-system";

export const metadata: Metadata = {
  title: "Admin Component Gallery | CTPS",
  description: "Unprotected Phase 2 preview of CTPS admin design foundations.",
};

export default function Page() {
  return <AdminDesignSystem />;
}
