import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth-forms";
import { currentIdentity } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export default async function ChangePasswordPage() {
  const identity = await currentIdentity();
  if (!identity) redirect("/login?next=/change-password");
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>
            {identity.mustChangePassword ? "Set a new password" : "Change password"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Use 12–128 characters. Passphrases and spaces are supported.
          </p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </main>
  );
}
