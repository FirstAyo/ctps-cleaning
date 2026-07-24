import { Card, CardContent, CardHeader, CardTitle } from "@ctps/ui/content";
import { redirect } from "next/navigation";
import { LoginForm, LoginThemeToggle } from "@/components/auth-forms";
import { currentIdentity } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export default async function LoginPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ next?: string }>;
}) {
  const identity = await currentIdentity();
  if (identity) redirect(identity.mustChangePassword ? "/change-password" : "/dashboard");
  const next = (await searchParams).next ?? null;
  return (
    <main className="grid min-h-dvh place-items-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <strong>CTPS Staff Portal</strong>
          <LoginThemeToggle />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Staff sign in</CardTitle>
            <p className="text-sm text-muted-foreground">
              Authorized CTPS staff only. Contact a Super Admin for account recovery.
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm next={next} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
