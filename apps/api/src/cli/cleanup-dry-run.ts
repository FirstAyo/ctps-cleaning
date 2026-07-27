import { prisma } from "@ctps/database";

async function main(): Promise<void> {
  if (process.argv.includes("--execute"))
    throw new Error("Phase 10 cleanup is intentionally dry-run only until retention is approved.");
  const now = new Date();
  const [sessions, throttles, quoteDrafts, estimateResults, exhaustedOutbox] = await Promise.all([
    prisma.session.count({
      where: { OR: [{ absoluteExpiresAt: { lt: now } }, { idleExpiresAt: { lt: now } }] },
    }),
    prisma.loginThrottle.count({ where: { blockedUntil: { lt: now } } }),
    prisma.quoteRequestDraft.count({ where: { expiresAt: { lt: now }, submittedAt: null } }),
    prisma.estimateResult.count({ where: { expiresAt: { lt: now }, archivedAt: null } }),
    prisma.emailOutbox.count({ where: { status: "FAILED", attempts: { gte: 5 } } }),
  ]);
  process.stdout.write(
    JSON.stringify({
      dryRun: true,
      sessions,
      throttles,
      quoteDrafts,
      estimateResults,
      exhaustedOutbox,
    }) + "\n",
  );
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Cleanup inspection failed."}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
