import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <p className="text-sm font-semibold text-muted-foreground">Not found</p>
      <h1 className="mt-2 text-3xl font-semibold">The administration page is unavailable.</h1>
      <p className="mt-4 text-muted-foreground">
        The record may not exist or your access may not permit it.
      </p>
      <Link className="mt-6 inline-block font-semibold text-primary" href="/dashboard">
        Return to dashboard
      </Link>
    </main>
  );
}
