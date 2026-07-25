import { describe, expect, it } from "vitest";
import {
  calculatePreliminaryEstimate,
  validatePricingDefinition,
  type ServicePricingDefinition,
} from "../src";

const configuration: ServicePricingDefinition = {
  serviceKey: "window-cleaning",
  enabled: true,
  baseMinimumCents: 10000,
  baseMaximumCents: 15000,
  minimumChargeCents: 12000,
  maximumEstimatorCents: 100000,
  roundingIncrementCents: 500,
  customerDisclaimer: "Preliminary only.",
  assumptions: ["Standard access."],
  exclusions: ["Repairs."],
  rules: [
    {
      ruleKey: "windows",
      questionKey: "windowCount",
      ruleType: "PER_UNIT_RANGE",
      conditionOperator: "GREATER_THAN",
      comparisonValue: 0,
      minimumAdjustmentCents: 123,
      maximumAdjustmentCents: 234,
      sortOrder: 1,
      enabled: true,
      publicLabel: "Window count",
    },
    {
      ruleKey: "commercial",
      questionKey: "customerType",
      ruleType: "PERCENTAGE_RANGE_ADJUSTMENT",
      conditionOperator: "EQUALS",
      comparisonValue: "COMMERCIAL",
      adjustmentBasisPoints: 1250,
      sortOrder: 2,
      enabled: true,
      publicLabel: "Commercial property",
    },
  ],
};

describe("preliminary pricing engine", () => {
  it("is deterministic, integer-safe, and rounds outward", () => {
    const input = {
      serviceKey: "window-cleaning" as const,
      customerType: "COMMERCIAL" as const,
      serviceAreaKey: "vancouver",
      answers: { windowCount: 3 },
    };
    const first = calculatePreliminaryEstimate(configuration, input);
    expect(calculatePreliminaryEstimate(configuration, input)).toEqual(first);
    expect(first).toMatchObject({
      outcome: "RANGE",
      minimumCents: 12000,
      maximumCents: 18000,
      currency: "CAD",
    });
    expect(first.minimumCents! % 500).toBe(0);
    expect(first.maximumCents! % 500).toBe(0);
  });

  it("uses manual review without fabricating a range", () => {
    const result = calculatePreliminaryEstimate(
      {
        ...configuration,
        rules: [
          {
            ruleKey: "unsafe",
            questionKey: "condition",
            ruleType: "MANUAL_REVIEW",
            conditionOperator: "EQUALS",
            comparisonValue: "heavy",
            sortOrder: 1,
            enabled: true,
            publicLabel: "A closer review is required",
          },
        ],
      },
      {
        serviceKey: "window-cleaning",
        customerType: "RESIDENTIAL",
        serviceAreaKey: "burnaby",
        answers: { condition: "heavy" },
      },
    );
    expect(result).toEqual(
      expect.objectContaining({ outcome: "MANUAL_REVIEW", minimumCents: null, maximumCents: null }),
    );
  });

  it("rejects invalid configuration and unknown questions", () => {
    expect(
      validatePricingDefinition({
        ...configuration,
        baseMinimumCents: 20000,
        baseMaximumCents: 10000,
        rules: [{ ...configuration.rules[0]!, questionKey: "invented" }],
      }),
    ).toEqual(
      expect.arrayContaining([
        "Base minimum cannot exceed base maximum.",
        "Rule windows references an unknown question.",
      ]),
    );
  });

  it("enforces cap and minimum charge", () => {
    const result = calculatePreliminaryEstimate(
      {
        ...configuration,
        maximumEstimatorCents: 20000,
        rules: [
          {
            ...configuration.rules[0]!,
            minimumAdjustmentCents: 999999,
            maximumAdjustmentCents: 999999,
          },
        ],
      },
      {
        serviceKey: "window-cleaning",
        customerType: "RESIDENTIAL",
        serviceAreaKey: "surrey",
        answers: { windowCount: 10 },
      },
    );
    expect(result.minimumCents).toBe(20000);
    expect(result.maximumCents).toBe(20000);
  });
});
