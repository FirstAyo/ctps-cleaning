import { Card, CardContent, CardHeader } from "@ctps/ui/content";
import Image from "next/image";
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
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="inline-flex rounded-md bg-white p-1">
            <Image
              alt="CTPS Complete Technical & Property Solutions"
              className="h-12 w-auto object-contain sm:h-14"
              height={241}
              priority
              src="/images/brand/ctps-logo.jpg"
              width={451}
            />
            <strong className="sr-only">CTPS Staff Portal</strong>
          </div>
          <LoginThemeToggle />
        </div>
        <Card>
          <CardHeader>
            <h1 className="text-lg font-semibold tracking-tight">Staff sign in</h1>
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
