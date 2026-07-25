import { prisma, type Prisma } from "@ctps/database";
import { INITIAL_DRAFT_PRICING } from "@ctps/pricing";

const VERSION_CODE = "DEV-INITIAL-REQUIRES-APPROVAL";
async function main() {
  await prisma.$connect();
  const owner = await prisma.user.findFirst({
    where: { status: "ACTIVE", roles: { some: { role: { key: "SUPER_ADMIN" } } } },
    orderBy: { createdAt: "asc" },
  });
  if (!owner)
    throw new Error(
      "Bootstrap an active Super Admin before creating the development pricing draft.",
    );
  const existing = await prisma.pricingVersion.findUnique({ where: { versionCode: VERSION_CODE } });
  if (existing) {
    process.stdout.write(`Development pricing draft already exists: ${VERSION_CODE}.\n`);
    return;
  }
  await prisma.$transaction(async (transaction) => {
    const version = await transaction.pricingVersion.create({
      data: {
        versionCode: VERSION_CODE,
        name: "Initial configurable pricing — business approval required",
        status: "DRAFT",
        notes:
          "Development starting values only. Review, test, approve, set an effective date, and explicitly publish in Admin.",
        createdByUserId: owner.id,
        updatedByUserId: owner.id,
      },
    });
    for (const [displayOrder, definition] of INITIAL_DRAFT_PRICING.entries()) {
      const configuration = await transaction.servicePricingConfiguration.create({
        data: {
          pricingVersionId: version.id,
          serviceKey: definition.serviceKey,
          enabled: definition.enabled,
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
      await transaction.pricingRule.createMany({
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
          enabled: rule.enabled,
          publicLabel: rule.publicLabel,
        })),
      });
    }
  });
  process.stdout.write(
    `Created DRAFT ${VERSION_CODE}. It is not available to the public until a Super Admin approves and publishes it.\n`,
  );
}
void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Estimator initialization failed."}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
