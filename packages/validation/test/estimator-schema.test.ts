import { describe, expect, it } from "vitest";
import {
  estimatorCalculationSchema,
  pricingRuleSchema,
  servicePricingConfigurationSchema,
} from "../src";
const valid = {
  idempotencyKey: "00000000-0000-4000-8000-000000000077",
  honeypot: "",
  serviceKey: "window-cleaning",
  customerType: "RESIDENTIAL",
  serviceAreaKey: "north-vancouver",
  answers: { windowCount: 10 },
};
describe("estimator boundary schemas", () => {
  it("accepts one approved service and British Columbia area key", () =>
    expect(estimatorCalculationSchema.parse(valid).serviceAreaKey).toBe("north-vancouver"));
  it("rejects unknown areas, client prices, and unexpected fields", () => {
    expect(
      estimatorCalculationSchema.safeParse({ ...valid, serviceAreaKey: "toronto" }).success,
    ).toBe(false);
    expect(estimatorCalculationSchema.safeParse({ ...valid, minimumCents: 1 }).success).toBe(false);
  });
  it("requires integer-cent service configuration", () =>
    expect(
      servicePricingConfigurationSchema.safeParse({
        serviceKey: "window-cleaning",
        enabled: true,
        baseMinimumCents: 1.5,
        baseMaximumCents: 200,
        minimumChargeCents: 0,
        maximumEstimatorCents: 1000,
        roundingIncrementCents: 500,
        displayOrder: 0,
        customerDisclaimer: "Preliminary estimate only.",
        assumptions: [],
        exclusions: [],
      }).success,
    ).toBe(false));
  it("accepts typed rules and rejects executable expressions", () => {
    expect(
      pricingRuleSchema.safeParse({
        ruleKey: "count",
        questionKey: "windowCount",
        ruleType: "PER_UNIT_RANGE",
        conditionOperator: "GREATER_THAN",
        comparisonValue: 0,
        minimumAdjustmentCents: 100,
        maximumAdjustmentCents: 200,
        sortOrder: 1,
        enabled: true,
        publicLabel: "Window count",
      }).success,
    ).toBe(true);
    expect(
      pricingRuleSchema.safeParse({
        ruleKey: "eval()",
        questionKey: "windowCount",
        ruleType: "EVAL",
        conditionOperator: "EQUALS",
        sortOrder: 1,
        enabled: true,
        publicLabel: "Unsafe",
      }).success,
    ).toBe(false);
  });
});
