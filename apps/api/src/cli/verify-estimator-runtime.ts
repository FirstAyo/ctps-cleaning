import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { prisma, type Prisma } from "@ctps/database";
import { INITIAL_DRAFT_PRICING } from "@ctps/pricing";
import { createApiApplication } from "../api-application";

const origin = process.env.WEB_URL ?? "http://localhost:3000";
const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const code = `RUNTIME-${randomUUID()}`;
let api: INestApplication | undefined;
const versionIds: string[] = [];
const resultIds: string[] = [];
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      origin,
      "content-type": "application/json",
      "user-agent": `ctps-phase7-${code}`,
      ...init.headers,
    },
  });
  return { response, body: (await response.json().catch(() => ({}))) as Record<string, unknown> };
}
async function main() {
  await prisma.$connect();
  assert(
    (await prisma.pricingVersion.count({
      where: {
        status: "PUBLISHED",
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
      },
    })) === 0,
    "Runtime verification requires no active business pricing version so it cannot alter approved configuration.",
  );
  const owner = await prisma.user.findFirst({
    where: { status: "ACTIVE", roles: { some: { role: { key: "SUPER_ADMIN" } } } },
  });
  assert(owner, "An active Super Admin is required.");
  const authorPricingPermissions = await prisma.rolePermission.count({
    where: {
      role: { key: "AUTHOR" },
      permission: {
        OR: [
          { key: { startsWith: "pricingVersions." } },
          { key: { startsWith: "pricingRules." } },
          { key: { startsWith: "estimatorResults." } },
        ],
      },
    },
  });
  assert(authorPricingPermissions === 0, "Author unexpectedly has estimator permissions.");
  const version = await prisma.pricingVersion.create({
    data: {
      versionCode: code,
      name: "Disposable Phase 7 runtime verification",
      status: "PUBLISHED",
      effectiveFrom: new Date(Date.now() - 60_000),
      publishedAt: new Date(),
      createdByUserId: owner.id,
      updatedByUserId: owner.id,
    },
  });
  versionIds.push(version.id);
  for (const [displayOrder, definition] of INITIAL_DRAFT_PRICING.entries()) {
    const configuration = await prisma.servicePricingConfiguration.create({
      data: {
        pricingVersionId: version.id,
        serviceKey: definition.serviceKey,
        enabled: true,
        baseMinimumCents: definition.baseMinimumCents,
        baseMaximumCents: definition.baseMaximumCents,
        minimumChargeCents: definition.minimumChargeCents,
        maximumEstimatorCents: definition.maximumEstimatorCents,
        roundingIncrementCents: definition.roundingIncrementCents,
        displayOrder,
        customerDisclaimer: definition.customerDisclaimer,
        assumptions: definition.assumptions as Prisma.InputJsonValue,
        exclusions: definition.exclusions as Prisma.InputJsonValue,
      },
    });
    await prisma.pricingRule.createMany({
      data: definition.rules.map((rule) => ({
        servicePricingConfigurationId: configuration.id,
        ruleKey: rule.ruleKey,
        questionKey: rule.questionKey,
        ruleType: rule.ruleType,
        conditionOperator: rule.conditionOperator,
        comparisonValue: rule.comparisonValue as Prisma.InputJsonValue,
        minimumAdjustmentCents: rule.minimumAdjustmentCents ?? null,
        maximumAdjustmentCents: rule.maximumAdjustmentCents ?? null,
        adjustmentBasisPoints: rule.adjustmentBasisPoints ?? null,
        sortOrder: rule.sortOrder,
        enabled: true,
        publicLabel: rule.publicLabel,
      })),
    });
  }
  const created = await createApiApplication();
  api = created.app;
  await api.listen(created.environment.API_PORT, "127.0.0.1");
  const configuration = await request("public/estimator/configuration");
  assert(
    configuration.response.ok && (configuration.body.services as unknown[]).length === 5,
    "Published configuration was not exposed.",
  );
  const idempotencyKey = randomUUID();
  const rangeInput = {
    idempotencyKey,
    honeypot: "",
    serviceKey: "window-cleaning",
    customerType: "RESIDENTIAL",
    serviceAreaKey: "vancouver",
    answers: {
      windowCount: 12,
      storeys: 2,
      scope: "exterior",
      screens: false,
      tracksFrames: false,
      difficultAccess: false,
      condition: "standard",
    },
  };
  const range = await request("public/estimator/calculate", {
    method: "POST",
    body: JSON.stringify(rangeInput),
  });
  assert(range.response.ok && typeof range.body.token === "string", "Range calculation failed.");
  const rawToken = range.body.token as string;
  const rangeRow = await prisma.estimateResult.findUnique({
    where: {
      idempotencyKeyHash: (await import("node:crypto"))
        .createHash("sha256")
        .update(idempotencyKey)
        .digest("hex"),
    },
  });
  assert(
    rangeRow &&
      rangeRow.outcome === "RANGE" &&
      rangeRow.minimumCents !== null &&
      rangeRow.maximumCents !== null,
    "Range result was not persisted.",
  );
  resultIds.push(rangeRow.id);
  const replay = await request("public/estimator/calculate", {
    method: "POST",
    body: JSON.stringify(rangeInput),
  });
  assert(
    replay.response.ok &&
      replay.body.alreadyCalculated === true &&
      typeof replay.body.token === "string" &&
      JSON.stringify(replay.body.result) === JSON.stringify(range.body.result),
    "Idempotent replay did not return the original result.",
  );
  const currentToken = replay.body.token as string;
  const rotated = await request(`public/estimator/results/${rawToken}`);
  assert(rotated.response.status === 404, "Idempotent replay did not rotate result access safely.");
  const result = await request(`public/estimator/results/${currentToken}`);
  assert(
    result.response.ok && !("calculationTrace" in result.body),
    "Tokenized public result leaked or failed.",
  );
  const invalid = await request(`public/estimator/results/${"x".repeat(43)}`);
  assert(invalid.response.status === 404, "Invalid result tokens must fail closed.");
  const transfer = await request(`public/estimator/results/${currentToken}/quote-transfer`, {
    method: "POST",
    body: "{}",
  });
  assert(
    transfer.response.ok && typeof transfer.body.transferToken === "string",
    "Quote transfer was not created.",
  );
  const transferDetails = await request(
    `public/estimator/quote-transfer/${transfer.body.transferToken}`,
  );
  assert(
    transferDetails.response.ok && transferDetails.body.serviceKey === "window-cleaning",
    "Allowlisted transfer details failed.",
  );
  const manualKey = randomUUID();
  const manual = await request("public/estimator/calculate", {
    method: "POST",
    body: JSON.stringify({
      idempotencyKey: manualKey,
      honeypot: "",
      serviceKey: "moss-removal",
      customerType: "RESIDENTIAL",
      serviceAreaKey: "burnaby",
      answers: {
        surfaceType: "unknown",
        affectedArea: "medium",
        coverage: "moderate",
        storeys: 2,
        slope: "unknown",
        access: "unknown",
      },
    }),
  });
  assert(
    manual.response.ok && (manual.body.result as { outcome?: string }).outcome === "MANUAL_REVIEW",
    "Manual-review behavior failed.",
  );
  const manualRow = await prisma.estimateResult.findUnique({
    where: {
      idempotencyKeyHash: (await import("node:crypto"))
        .createHash("sha256")
        .update(manualKey)
        .digest("hex"),
    },
  });
  if (manualRow) resultIds.push(manualRow.id);
  const otherServices = [
    {
      serviceKey: "pressure-washing",
      answers: {
        surfaceType: "concrete",
        areaSqFt: 500,
        distinctAreas: 1,
        staining: "light",
        oilGrease: false,
        access: "standard",
        drainage: "standard",
      },
    },
    {
      serviceKey: "gutter-cleaning",
      answers: {
        storeys: 2,
        perimeter: "medium",
        guards: false,
        downspouts: true,
        heavyDebris: false,
        detachedStructures: 0,
        access: false,
      },
    },
    {
      serviceKey: "vent-cleaning",
      answers: {
        ventType: "dryer",
        ventCount: 1,
        length: "short",
        outletAccess: "easy",
        lastCleaned: "under-year",
        concern: "routine",
      },
    },
  ];
  for (const item of otherServices) {
    const key = randomUUID();
    const calculated = await request("public/estimator/calculate", {
      method: "POST",
      body: JSON.stringify({
        idempotencyKey: key,
        honeypot: "",
        serviceKey: item.serviceKey,
        customerType: "RESIDENTIAL",
        serviceAreaKey: "coquitlam",
        answers: item.answers,
      }),
    });
    assert(
      calculated.response.ok &&
        (calculated.body.result as { outcome?: string }).outcome === "RANGE",
      `${item.serviceKey} runtime calculation failed.`,
    );
    const stored = await prisma.estimateResult.findUnique({
      where: {
        idempotencyKeyHash: (await import("node:crypto"))
          .createHash("sha256")
          .update(key)
          .digest("hex"),
      },
    });
    if (stored) resultIds.push(stored.id);
  }
  const historicalSnapshot = {
    minimumCents: rangeRow.minimumCents,
    maximumCents: rangeRow.maximumCents,
    pricingVersionCode: rangeRow.pricingVersionCode,
  };
  const source = await prisma.pricingVersion.findUniqueOrThrow({
    where: { id: version.id },
    include: { configurations: { include: { rules: true } } },
  });
  await prisma.pricingVersion.update({
    where: { id: version.id },
    data: { status: "ARCHIVED", archivedAt: new Date() },
  });
  const newer = await prisma.pricingVersion.create({
    data: {
      versionCode: `${code}-NEWER`,
      name: "Disposable newer Phase 7 runtime version",
      status: "PUBLISHED",
      effectiveFrom: new Date(),
      publishedAt: new Date(),
      createdByUserId: owner.id,
      updatedByUserId: owner.id,
      configurations: {
        create: source.configurations.map((item) => ({
          serviceKey: item.serviceKey,
          enabled: item.enabled,
          baseMinimumCents: item.baseMinimumCents,
          baseMaximumCents: item.baseMaximumCents,
          minimumChargeCents: item.minimumChargeCents,
          maximumEstimatorCents: item.maximumEstimatorCents,
          roundingIncrementCents: item.roundingIncrementCents,
          displayOrder: item.displayOrder,
          customerDisclaimer: item.customerDisclaimer,
          assumptions: item.assumptions as Prisma.InputJsonValue,
          exclusions: item.exclusions as Prisma.InputJsonValue,
          rules: {
            create: item.rules.map((rule) => ({
              ruleKey: rule.ruleKey,
              questionKey: rule.questionKey,
              ruleType: rule.ruleType,
              conditionOperator: rule.conditionOperator,
              comparisonValue: rule.comparisonValue as Prisma.InputJsonValue,
              minimumAdjustmentCents: rule.minimumAdjustmentCents,
              maximumAdjustmentCents: rule.maximumAdjustmentCents,
              adjustmentBasisPoints: rule.adjustmentBasisPoints,
              sortOrder: rule.sortOrder,
              enabled: rule.enabled,
              publicLabel: rule.publicLabel,
            })),
          },
        })),
      },
    },
  });
  versionIds.push(newer.id);
  const newerKey = randomUUID();
  const newerResult = await request("public/estimator/calculate", {
    method: "POST",
    body: JSON.stringify({ ...rangeInput, idempotencyKey: newerKey }),
  });
  assert(
    newerResult.response.ok &&
      (newerResult.body.result as { pricingVersionCode?: string }).pricingVersionCode ===
        newer.versionCode,
    "New estimates did not select the newer published version.",
  );
  const newerRow = await prisma.estimateResult.findUnique({
    where: {
      idempotencyKeyHash: (await import("node:crypto"))
        .createHash("sha256")
        .update(newerKey)
        .digest("hex"),
    },
  });
  if (newerRow) resultIds.push(newerRow.id);
  const unchangedHistorical = await prisma.estimateResult.findUniqueOrThrow({
    where: { id: rangeRow.id },
  });
  assert(
    unchangedHistorical.minimumCents === historicalSnapshot.minimumCents &&
      unchangedHistorical.maximumCents === historicalSnapshot.maximumCents &&
      unchangedHistorical.pricingVersionCode === historicalSnapshot.pricingVersionCode,
    "A historical estimate changed after publishing a newer version.",
  );
  await prisma.estimateResult.update({
    where: { id: rangeRow.id },
    data: { expiresAt: new Date(Date.now() - 1) },
  });
  const expired = await request(`public/estimator/results/${currentToken}`);
  assert(expired.response.status === 404, "Expired result remained public.");
  await prisma.estimateResult.deleteMany({ where: { id: { in: resultIds } } });
  await prisma.auditLog.deleteMany({
    where: { resourceType: "estimate-result", resourceId: { in: resultIds } },
  });
  resultIds.length = 0;
  await prisma.pricingVersion.deleteMany({ where: { id: { in: versionIds } } });
  versionIds.length = 0;
  const unavailable = await request("public/estimator/configuration");
  assert(unavailable.response.status === 503, "No-active-version behavior did not fail closed.");
  process.stdout.write(
    `Phase 7 runtime verification passed: all five services, manual review, idempotency, token access, expiry, quote transfer, historical versioning, Author denial, and no-active-version behavior (${code}).\n`,
  );
}
void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Runtime verification failed."}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (api) await api.close();
    if (resultIds.length)
      await prisma.estimateResult.deleteMany({ where: { id: { in: resultIds } } });
    if (versionIds.length) {
      await prisma.auditLog.deleteMany({
        where: { resourceType: "estimate-result", resourceId: { in: resultIds } },
      });
      await prisma.pricingVersion.deleteMany({ where: { id: { in: versionIds } } });
    }
    await prisma.$disconnect();
  });
