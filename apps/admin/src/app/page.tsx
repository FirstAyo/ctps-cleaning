import { redirect } from "next/navigation";
import { currentIdentity } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export default async function Page() {
  const identity = await currentIdentity();
  redirect(identity ? (identity.mustChangePassword ? "/change-password" : "/dashboard") : "/login");
}
