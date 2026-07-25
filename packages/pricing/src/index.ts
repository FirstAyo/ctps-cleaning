export const ESTIMATOR_SERVICE_KEYS = [
  "window-cleaning",
  "pressure-washing",
  "gutter-cleaning",
  "moss-removal",
  "vent-cleaning",
] as const;
export const ESTIMATOR_SERVICE_AREAS = [
  { key: "vancouver", label: "Vancouver" },
  { key: "richmond", label: "Richmond" },
  { key: "burnaby", label: "Burnaby" },
  { key: "surrey", label: "Surrey" },
  { key: "coquitlam", label: "Coquitlam" },
  { key: "north-vancouver", label: "North Vancouver" },
] as const;
export type EstimatorServiceKey = (typeof ESTIMATOR_SERVICE_KEYS)[number];
export type EstimatorCustomerType = "RESIDENTIAL" | "COMMERCIAL";
export type EstimatorAnswer = string | number | boolean;
export type EstimatorAnswers = Readonly<Record<string, EstimatorAnswer>>;

export interface EstimatorQuestion {
  key: string;
  serviceKey: EstimatorServiceKey;
  label: string;
  helpText: string;
  type: "number" | "boolean" | "select";
  required: boolean;
  options?: readonly string[];
  minimum?: number;
  maximum?: number;
  quoteQuestionKey?: string;
  displayOrder: number;
}

const question = (
  serviceKey: EstimatorServiceKey,
  key: string,
  label: string,
  type: EstimatorQuestion["type"],
  displayOrder: number,
  options?: readonly string[],
  boundaries?: { minimum: number; maximum: number },
  quoteQuestionKey?: string,
): EstimatorQuestion => ({
  key,
  serviceKey,
  label,
  helpText: "Choose the closest practical answer. CTPS will confirm the final scope.",
  type,
  required: true,
  ...(options ? { options } : {}),
  ...boundaries,
  ...(quoteQuestionKey ? { quoteQuestionKey } : {}),
  displayOrder,
});

export const ESTIMATOR_QUESTIONS: readonly EstimatorQuestion[] = [
  question(
    "window-cleaning",
    "windowCount",
    "Approximate number of windows",
    "number",
    1,
    undefined,
    { minimum: 1, maximum: 500 },
  ),
  question(
    "window-cleaning",
    "storeys",
    "Number of storeys",
    "number",
    2,
    undefined,
    { minimum: 1, maximum: 10 },
    "storeys",
  ),
  question("window-cleaning", "scope", "Cleaning scope", "select", 3, [
    "exterior",
    "interior",
    "both",
  ]),
  question("window-cleaning", "screens", "Include screens?", "boolean", 4),
  question("window-cleaning", "tracksFrames", "Include tracks or frames?", "boolean", 5),
  question("window-cleaning", "difficultAccess", "Difficult-access windows?", "boolean", 6),
  question("window-cleaning", "condition", "Window condition", "select", 7, ["standard", "heavy"]),
  question(
    "pressure-washing",
    "surfaceType",
    "Surface type",
    "select",
    1,
    ["concrete", "pavers", "vinyl", "wood", "unknown"],
    undefined,
    "surfaces",
  ),
  question(
    "pressure-washing",
    "areaSqFt",
    "Approximate area (sq. ft.)",
    "number",
    2,
    undefined,
    { minimum: 1, maximum: 100000 },
    "approximateArea",
  ),
  question(
    "pressure-washing",
    "distinctAreas",
    "Number of distinct areas",
    "number",
    3,
    undefined,
    { minimum: 1, maximum: 20 },
  ),
  question("pressure-washing", "staining", "Staining level", "select", 4, [
    "light",
    "moderate",
    "heavy",
  ]),
  question("pressure-washing", "oilGrease", "Oil or grease concern?", "boolean", 5),
  question("pressure-washing", "access", "Access complexity", "select", 6, ["standard", "complex"]),
  question("pressure-washing", "drainage", "Drainage complexity", "select", 7, [
    "standard",
    "uncertain",
  ]),
  question(
    "gutter-cleaning",
    "storeys",
    "Number of storeys",
    "number",
    1,
    undefined,
    { minimum: 1, maximum: 10 },
    "storeys",
  ),
  question("gutter-cleaning", "perimeter", "Building perimeter", "select", 2, [
    "small",
    "medium",
    "large",
  ]),
  question("gutter-cleaning", "guards", "Gutter guards installed?", "boolean", 3),
  question("gutter-cleaning", "downspouts", "Include downspout flushing?", "boolean", 4),
  question("gutter-cleaning", "heavyDebris", "Heavy debris?", "boolean", 5),
  question("gutter-cleaning", "detachedStructures", "Detached structures", "number", 6, undefined, {
    minimum: 0,
    maximum: 10,
  }),
  question("gutter-cleaning", "access", "Access limitations?", "boolean", 7),
  question("moss-removal", "surfaceType", "Surface type", "select", 1, [
    "asphalt-shingle",
    "concrete-tile",
    "metal",
    "wood",
    "unknown",
  ]),
  question("moss-removal", "affectedArea", "Affected area", "select", 2, [
    "small",
    "medium",
    "large",
  ]),
  question("moss-removal", "coverage", "Moss coverage", "select", 3, [
    "light",
    "moderate",
    "heavy",
  ]),
  question("moss-removal", "storeys", "Number of storeys", "number", 4, undefined, {
    minimum: 1,
    maximum: 5,
  }),
  question("moss-removal", "slope", "Roof slope", "select", 5, [
    "low",
    "moderate",
    "steep",
    "unknown",
  ]),
  question("moss-removal", "access", "Access complexity", "select", 6, [
    "standard",
    "complex",
    "unknown",
  ]),
  question(
    "vent-cleaning",
    "ventType",
    "Vent type",
    "select",
    1,
    ["dryer", "bathroom-exhaust", "hvac-duct", "commercial"],
    undefined,
    "ventType",
  ),
  question(
    "vent-cleaning",
    "ventCount",
    "Number of vents",
    "number",
    2,
    undefined,
    { minimum: 1, maximum: 100 },
    "ventCount",
  ),
  question("vent-cleaning", "length", "Approximate vent length", "select", 3, [
    "short",
    "medium",
    "long",
    "unknown",
  ]),
  question("vent-cleaning", "outletAccess", "Exterior outlet accessibility", "select", 4, [
    "easy",
    "difficult",
    "unknown",
  ]),
  question("vent-cleaning", "lastCleaned", "Last known cleaning", "select", 5, [
    "under-year",
    "one-to-three-years",
    "over-three-years",
    "unknown",
  ]),
  question("vent-cleaning", "concern", "Current concern", "select", 6, [
    "routine",
    "reduced-airflow",
    "safety-concern",
  ]),
];

export type PricingRuleType =
  | "TIER_RANGE"
  | "FIXED_RANGE_REPLACEMENT"
  | "PER_UNIT_RANGE"
  | "FIXED_RANGE_ADDITION"
  | "CUSTOMER_TYPE_RANGE_ADDITION"
  | "SERVICE_AREA_RANGE_ADDITION"
  | "PERCENTAGE_RANGE_ADJUSTMENT"
  | "MINIMUM_CHARGE"
  | "MANUAL_REVIEW";
export type ConditionOperator =
  | "EQUALS"
  | "NOT_EQUALS"
  | "IN"
  | "GREATER_THAN"
  | "GREATER_THAN_OR_EQUAL"
  | "LESS_THAN"
  | "LESS_THAN_OR_EQUAL"
  | "BOOLEAN_TRUE"
  | "BOOLEAN_FALSE";
export interface PricingRuleDefinition {
  ruleKey: string;
  questionKey: string;
  ruleType: PricingRuleType;
  conditionOperator: ConditionOperator;
  comparisonValue?: EstimatorAnswer | readonly EstimatorAnswer[];
  minimumAdjustmentCents?: number;
  maximumAdjustmentCents?: number;
  adjustmentBasisPoints?: number;
  sortOrder: number;
  enabled: boolean;
  publicLabel: string;
}
export interface ServicePricingDefinition {
  serviceKey: EstimatorServiceKey;
  enabled: boolean;
  baseMinimumCents: number;
  baseMaximumCents: number;
  minimumChargeCents: number;
  maximumEstimatorCents: number;
  roundingIncrementCents: number;
  customerDisclaimer: string;
  assumptions: readonly string[];
  exclusions: readonly string[];
  rules: readonly PricingRuleDefinition[];
}
export interface CalculationInput {
  serviceKey: EstimatorServiceKey;
  customerType: EstimatorCustomerType;
  serviceAreaKey: string;
  answers: EstimatorAnswers;
}
export interface CalculationTraceItem {
  ruleKey: string;
  ruleType: PricingRuleType;
  beforeMinimumCents: number;
  beforeMaximumCents: number;
  afterMinimumCents: number;
  afterMaximumCents: number;
}
export interface CalculationResult {
  outcome: "RANGE" | "MANUAL_REVIEW";
  minimumCents: number | null;
  maximumCents: number | null;
  currency: "CAD";
  publicDrivers: readonly string[];
  trace: readonly CalculationTraceItem[];
}

const integer = (value: number, name: string) => {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new Error(`${name} must be a non-negative safe integer.`);
  return value;
};
const conditionMatches = (rule: PricingRuleDefinition, value: EstimatorAnswer | undefined) => {
  const target = rule.comparisonValue;
  switch (rule.conditionOperator) {
    case "EQUALS":
      return value === target;
    case "NOT_EQUALS":
      return value !== target;
    case "IN":
      return Array.isArray(target) && target.includes(value as never);
    case "GREATER_THAN":
      return typeof value === "number" && typeof target === "number" && value > target;
    case "GREATER_THAN_OR_EQUAL":
      return typeof value === "number" && typeof target === "number" && value >= target;
    case "LESS_THAN":
      return typeof value === "number" && typeof target === "number" && value < target;
    case "LESS_THAN_OR_EQUAL":
      return typeof value === "number" && typeof target === "number" && value <= target;
    case "BOOLEAN_TRUE":
      return value === true;
    case "BOOLEAN_FALSE":
      return value === false;
  }
};
const order: Record<PricingRuleType, number> = {
  TIER_RANGE: 1,
  FIXED_RANGE_REPLACEMENT: 1,
  PER_UNIT_RANGE: 2,
  FIXED_RANGE_ADDITION: 3,
  CUSTOMER_TYPE_RANGE_ADDITION: 4,
  SERVICE_AREA_RANGE_ADDITION: 5,
  PERCENTAGE_RANGE_ADJUSTMENT: 6,
  MINIMUM_CHARGE: 7,
  MANUAL_REVIEW: 0,
};
const percentage = (cents: number, basisPoints: number, direction: "down" | "up") => {
  const numerator = cents * (10_000 + basisPoints);
  return direction === "down" ? Math.floor(numerator / 10_000) : Math.ceil(numerator / 10_000);
};

export function validatePricingDefinition(
  configuration: ServicePricingDefinition,
): readonly string[] {
  const errors: string[] = [];
  if (!ESTIMATOR_SERVICE_KEYS.includes(configuration.serviceKey))
    errors.push("Unknown service key.");
  for (const [name, value] of Object.entries({
    baseMinimumCents: configuration.baseMinimumCents,
    baseMaximumCents: configuration.baseMaximumCents,
    minimumChargeCents: configuration.minimumChargeCents,
    maximumEstimatorCents: configuration.maximumEstimatorCents,
    roundingIncrementCents: configuration.roundingIncrementCents,
  })) {
    try {
      integer(value, name);
    } catch (error) {
      errors.push((error as Error).message);
    }
  }
  if (configuration.baseMinimumCents > configuration.baseMaximumCents)
    errors.push("Base minimum cannot exceed base maximum.");
  if (configuration.maximumEstimatorCents < configuration.minimumChargeCents)
    errors.push("Maximum estimator value cannot be below the minimum charge.");
  if (configuration.roundingIncrementCents <= 0)
    errors.push("Rounding increment must be positive.");
  const known = new Set(
    ESTIMATOR_QUESTIONS.filter(({ serviceKey }) => serviceKey === configuration.serviceKey).map(
      ({ key }) => key,
    ),
  );
  for (const rule of configuration.rules)
    if (
      !["customerType", "serviceAreaKey"].includes(rule.questionKey) &&
      !known.has(rule.questionKey)
    )
      errors.push(`Rule ${rule.ruleKey} references an unknown question.`);
  return errors;
}

export function calculatePreliminaryEstimate(
  configuration: ServicePricingDefinition,
  input: CalculationInput,
): CalculationResult {
  const errors = validatePricingDefinition(configuration);
  if (errors.length) throw new Error(errors.join(" "));
  if (!configuration.enabled || configuration.serviceKey !== input.serviceKey)
    throw new Error("This service is not available for estimation.");
  let minimum = configuration.baseMinimumCents;
  let maximum = configuration.baseMaximumCents;
  const trace: CalculationTraceItem[] = [];
  const drivers: string[] = [];
  const rules = [...configuration.rules].sort(
    (a, b) =>
      order[a.ruleType] - order[b.ruleType] ||
      a.sortOrder - b.sortOrder ||
      a.ruleKey.localeCompare(b.ruleKey),
  );
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const value =
      rule.questionKey === "customerType"
        ? input.customerType
        : rule.questionKey === "serviceAreaKey"
          ? input.serviceAreaKey
          : input.answers[rule.questionKey];
    if (!conditionMatches(rule, value)) continue;
    if (rule.ruleType === "MANUAL_REVIEW")
      return {
        outcome: "MANUAL_REVIEW",
        minimumCents: null,
        maximumCents: null,
        currency: "CAD",
        publicDrivers: [rule.publicLabel],
        trace,
      };
    const beforeMinimumCents = minimum;
    const beforeMaximumCents = maximum;
    const minAdjustment = rule.minimumAdjustmentCents ?? 0;
    const maxAdjustment = rule.maximumAdjustmentCents ?? minAdjustment;
    if (["TIER_RANGE", "FIXED_RANGE_REPLACEMENT"].includes(rule.ruleType)) {
      minimum = minAdjustment;
      maximum = maxAdjustment;
    } else if (rule.ruleType === "PER_UNIT_RANGE") {
      const units = typeof value === "number" ? value : 0;
      minimum += minAdjustment * units;
      maximum += maxAdjustment * units;
    } else if (rule.ruleType === "PERCENTAGE_RANGE_ADJUSTMENT") {
      minimum = percentage(minimum, rule.adjustmentBasisPoints ?? 0, "down");
      maximum = percentage(maximum, rule.adjustmentBasisPoints ?? 0, "up");
    } else if (rule.ruleType === "MINIMUM_CHARGE") {
      minimum = Math.max(minimum, configuration.minimumChargeCents, minAdjustment);
      maximum = Math.max(maximum, minimum);
    } else {
      minimum += minAdjustment;
      maximum += maxAdjustment;
    }
    minimum = Math.min(minimum, configuration.maximumEstimatorCents);
    maximum = Math.min(maximum, configuration.maximumEstimatorCents);
    trace.push({
      ruleKey: rule.ruleKey,
      ruleType: rule.ruleType,
      beforeMinimumCents,
      beforeMaximumCents,
      afterMinimumCents: minimum,
      afterMaximumCents: maximum,
    });
    if (rule.publicLabel && !drivers.includes(rule.publicLabel)) drivers.push(rule.publicLabel);
  }
  minimum = Math.max(minimum, configuration.minimumChargeCents);
  maximum = Math.max(maximum, minimum);
  const increment = configuration.roundingIncrementCents;
  minimum = Math.floor(minimum / increment) * increment;
  maximum = Math.ceil(maximum / increment) * increment;
  if (minimum > maximum) throw new Error("Calculated minimum cannot exceed maximum.");
  return {
    outcome: "RANGE",
    minimumCents: minimum,
    maximumCents: maximum,
    currency: "CAD",
    publicDrivers: drivers,
    trace,
  };
}

export const pricingFoundationState = { implemented: true, phase: 7 } as const;

const draft = (
  serviceKey: EstimatorServiceKey,
  baseMinimumCents: number,
  baseMaximumCents: number,
  rules: readonly PricingRuleDefinition[],
): ServicePricingDefinition => ({
  serviceKey,
  enabled: true,
  baseMinimumCents,
  baseMaximumCents,
  minimumChargeCents: baseMinimumCents,
  maximumEstimatorCents: 500_000,
  roundingIncrementCents: 500,
  customerDisclaimer:
    "DRAFT values requiring CTPS business approval. Preliminary estimate only; final price follows staff review.",
  assumptions: [
    "The submitted measurements and selections are reasonably accurate.",
    "Standard site access and serviceability are available.",
  ],
  exclusions: [
    "Taxes, repairs, remediation, permits, and work outside the selected service are excluded.",
  ],
  rules,
});
const add = (
  ruleKey: string,
  questionKey: string,
  operator: ConditionOperator,
  comparisonValue: EstimatorAnswer,
  min: number,
  max: number,
  sortOrder: number,
  publicLabel: string,
  ruleType: PricingRuleType = "FIXED_RANGE_ADDITION",
): PricingRuleDefinition => ({
  ruleKey,
  questionKey,
  ruleType,
  conditionOperator: operator,
  comparisonValue,
  minimumAdjustmentCents: min,
  maximumAdjustmentCents: max,
  sortOrder,
  enabled: true,
  publicLabel,
});
const manual = (
  ruleKey: string,
  questionKey: string,
  value: EstimatorAnswer,
  label: string,
): PricingRuleDefinition => ({
  ruleKey,
  questionKey,
  ruleType: "MANUAL_REVIEW",
  conditionOperator: "EQUALS",
  comparisonValue: value,
  sortOrder: 0,
  enabled: true,
  publicLabel: label,
});

/** Development-only starting data. It is intentionally DRAFT and must never be auto-published. */
export const INITIAL_DRAFT_PRICING: readonly ServicePricingDefinition[] = [
  draft("window-cleaning", 12_000, 18_000, [
    add(
      "window-count",
      "windowCount",
      "GREATER_THAN",
      0,
      600,
      900,
      10,
      "Number of windows",
      "PER_UNIT_RANGE",
    ),
    add("window-both", "scope", "EQUALS", "both", 6_000, 10_000, 20, "Interior and exterior scope"),
    add("window-screens", "screens", "BOOLEAN_TRUE", true, 2_000, 4_000, 30, "Screen cleaning"),
    add(
      "window-access",
      "difficultAccess",
      "BOOLEAN_TRUE",
      true,
      4_000,
      8_000,
      40,
      "Access complexity",
    ),
  ]),
  draft("pressure-washing", 18_000, 26_000, [
    manual(
      "pressure-unknown",
      "surfaceType",
      "unknown",
      "Surface suitability requires staff review",
    ),
    manual("pressure-wood", "surfaceType", "wood", "Wood surfaces require staff review"),
    add(
      "pressure-area",
      "areaSqFt",
      "GREATER_THAN",
      0,
      20,
      35,
      10,
      "Approximate surface area",
      "PER_UNIT_RANGE",
    ),
    add(
      "pressure-oil",
      "oilGrease",
      "BOOLEAN_TRUE",
      true,
      6_000,
      12_000,
      20,
      "Oil or grease concern",
    ),
    manual("pressure-drainage", "drainage", "uncertain", "Drainage requires staff review"),
  ]),
  draft("gutter-cleaning", 16_000, 23_000, [
    add(
      "gutter-storeys",
      "storeys",
      "GREATER_THAN",
      0,
      3_000,
      5_000,
      10,
      "Building height",
      "PER_UNIT_RANGE",
    ),
    add("gutter-large", "perimeter", "EQUALS", "large", 8_000, 14_000, 20, "Building perimeter"),
    add("gutter-guards", "guards", "BOOLEAN_TRUE", true, 5_000, 9_000, 30, "Gutter guards"),
    add("gutter-debris", "heavyDebris", "BOOLEAN_TRUE", true, 4_000, 8_000, 40, "Heavy debris"),
  ]),
  draft("moss-removal", 30_000, 50_000, [
    manual("moss-unknown-surface", "surfaceType", "unknown", "Roof material requires staff review"),
    manual("moss-steep", "slope", "steep", "Roof slope requires staff review"),
    manual("moss-unknown-slope", "slope", "unknown", "Roof slope requires staff review"),
    add("moss-large", "affectedArea", "EQUALS", "large", 20_000, 35_000, 10, "Affected area"),
    add("moss-heavy", "coverage", "EQUALS", "heavy", 18_000, 30_000, 20, "Moss coverage"),
  ]),
  draft("vent-cleaning", 12_000, 18_000, [
    manual("vent-hvac", "ventType", "hvac-duct", "HVAC or duct inquiries require staff review"),
    manual(
      "vent-commercial",
      "ventType",
      "commercial",
      "Commercial vent inquiries require staff review",
    ),
    manual("vent-safety", "concern", "safety-concern", "Safety concerns require staff review"),
    add(
      "vent-count",
      "ventCount",
      "GREATER_THAN",
      0,
      4_000,
      6_500,
      10,
      "Number of vents",
      "PER_UNIT_RANGE",
    ),
    add(
      "vent-access",
      "outletAccess",
      "EQUALS",
      "difficult",
      5_000,
      9_000,
      20,
      "Outlet accessibility",
    ),
  ]),
] as const;
