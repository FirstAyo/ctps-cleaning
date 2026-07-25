import { createHash, randomBytes } from "node:crypto";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Prisma } from "@ctps/database";
import type { Request } from "express";
import {
  calculatePreliminaryEstimate,
  ESTIMATOR_QUESTIONS,
  ESTIMATOR_SERVICE_AREAS,
  validatePricingDefinition,
  type CalculationInput,
  type EstimatorAnswer,
  type ServicePricingDefinition,
} from "@ctps/pricing";
import {
  apiEnvironmentSchema,
  type EstimatorCalculationInput,
  type EstimatorResultListQuery,
  type PricingPreviewInput,
  type PricingRuleInput,
  type PricingVersionCreateInput,
  type PricingVersionUpdateInput,
  type ServicePricingConfigurationInput,
} from "@ctps/validation";
import { AuditService } from "../auth/audit.service";
import { DatabaseService } from "../database/database.service";

const json = (value: unknown) => value as Prisma.InputJsonValue;
const strings = (value: Prisma.JsonValue): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const stableInput = (input: Omit<EstimatorCalculationInput, "idempotencyKey" | "honeypot">) => ({
  ...input,
  answers: Object.fromEntries(Object.entries(input.answers).sort(([a], [b]) => a.localeCompare(b))),
});

@Injectable()
export class EstimatorService {
  private readonly config = apiEnvironmentSchema.parse(process.env);
  constructor(
    @Inject(DatabaseService) private readonly database: DatabaseService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private async activeVersion() {
    const now = new Date();
    const versions = await this.database.client.pricingVersion.findMany({
      where: {
        status: "PUBLISHED",
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      include: {
        configurations: {
          where: { enabled: true },
          include: { rules: true },
          orderBy: { displayOrder: "asc" },
        },
      },
      orderBy: { effectiveFrom: "desc" },
      take: 2,
    });
    if (versions.length !== 1)
      throw new ServiceUnavailableException({
        code: "ESTIMATOR_UNAVAILABLE",
        message: "The preliminary estimator is temporarily unavailable. Please request a quote.",
      });
    return versions[0]!;
  }
  private definition(
    configuration: Awaited<ReturnType<EstimatorService["activeVersion"]>>["configurations"][number],
  ): ServicePricingDefinition {
    return {
      serviceKey: configuration.serviceKey as ServicePricingDefinition["serviceKey"],
      enabled: configuration.enabled,
      baseMinimumCents: configuration.baseMinimumCents,
      baseMaximumCents: configuration.baseMaximumCents,
      minimumChargeCents: configuration.minimumChargeCents,
      maximumEstimatorCents: configuration.maximumEstimatorCents,
      roundingIncrementCents: configuration.roundingIncrementCents,
      customerDisclaimer: configuration.customerDisclaimer,
      assumptions: strings(configuration.assumptions),
      exclusions: strings(configuration.exclusions),
      rules: configuration.rules.map((rule) => ({
        ruleKey: rule.ruleKey,
        questionKey: rule.questionKey,
        ruleType: rule.ruleType,
        conditionOperator: rule.conditionOperator,
        ...(rule.comparisonValue !== null
          ? {
              comparisonValue: rule.comparisonValue as EstimatorAnswer | readonly EstimatorAnswer[],
            }
          : {}),
        ...(rule.minimumAdjustmentCents !== null
          ? { minimumAdjustmentCents: rule.minimumAdjustmentCents }
          : {}),
        ...(rule.maximumAdjustmentCents !== null
          ? { maximumAdjustmentCents: rule.maximumAdjustmentCents }
          : {}),
        ...(rule.adjustmentBasisPoints !== null
          ? { adjustmentBasisPoints: rule.adjustmentBasisPoints }
          : {}),
        sortOrder: rule.sortOrder,
        enabled: rule.enabled,
        publicLabel: rule.publicLabel,
      })),
    };
  }
  private validateAnswers(input: Omit<EstimatorCalculationInput, "idempotencyKey" | "honeypot">) {
    const questions = ESTIMATOR_QUESTIONS.filter(
      ({ serviceKey }) => serviceKey === input.serviceKey,
    );
    const known = new Set(questions.map(({ key }) => key));
    for (const key of Object.keys(input.answers))
      if (!known.has(key))
        throw new BadRequestException({
          code: "UNKNOWN_ESTIMATOR_ANSWER",
          message: `Unknown answer: ${key}.`,
        });
    for (const question of questions) {
      const answer = input.answers[question.key];
      if (question.required && (answer === undefined || answer === ""))
        throw new BadRequestException({
          code: "ESTIMATOR_ANSWER_REQUIRED",
          message: `${question.label} is required.`,
        });
      if (
        question.type === "number" &&
        (typeof answer !== "number" ||
          !Number.isInteger(answer) ||
          answer < (question.minimum ?? 0) ||
          answer > (question.maximum ?? Number.MAX_SAFE_INTEGER))
      )
        throw new BadRequestException({
          code: "INVALID_ESTIMATOR_ANSWER",
          message: `${question.label} is invalid.`,
        });
      if (question.type === "boolean" && typeof answer !== "boolean")
        throw new BadRequestException({
          code: "INVALID_ESTIMATOR_ANSWER",
          message: `${question.label} is invalid.`,
        });
      if (question.type === "select" && !question.options?.includes(String(answer)))
        throw new BadRequestException({
          code: "INVALID_ESTIMATOR_ANSWER",
          message: `${question.label} is invalid.`,
        });
    }
  }
  private assertOrigin(request: Request) {
    const supplied = request.get("origin") ?? request.get("referer");
    try {
      if (!supplied || new URL(supplied).origin !== new URL(this.config.WEB_URL).origin)
        throw new Error();
    } catch {
      throw new ForbiddenException({
        code: "ORIGIN_REJECTED",
        message: "The request origin was rejected.",
      });
    }
  }
  private async throttle(request: Request) {
    const now = new Date();
    const keyHash = hash(`estimate|${request.ip}|${request.get("user-agent") ?? "unknown"}`);
    const windowMs = this.config.ESTIMATOR_RATE_LIMIT_WINDOW_SECONDS * 1000;
    const current = await this.database.client.publicRequestThrottle.upsert({
      where: { keyHash },
      create: { keyHash, attempts: 1, windowStartedAt: now },
      update: {},
    });
    if (now.getTime() - current.windowStartedAt.getTime() >= windowMs) {
      await this.database.client.publicRequestThrottle.update({
        where: { keyHash },
        data: { attempts: 1, windowStartedAt: now, blockedUntil: null },
      });
      return;
    }
    if (
      (current.blockedUntil && current.blockedUntil > now) ||
      current.attempts >= this.config.ESTIMATOR_RATE_LIMIT_MAX_ATTEMPTS
    ) {
      await this.database.client.publicRequestThrottle.update({
        where: { keyHash },
        data: { blockedUntil: new Date(now.getTime() + windowMs) },
      });
      throw new HttpException(
        {
          code: "RATE_LIMITED",
          message: "Too many estimator requests. Please wait and try again.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    await this.database.client.publicRequestThrottle.update({
      where: { keyHash },
      data: { attempts: { increment: 1 } },
    });
  }
  async publicConfiguration() {
    const version = await this.activeVersion();
    const enabled = new Set(version.configurations.map(({ serviceKey }) => serviceKey));
    return {
      versionCode: version.versionCode,
      currency: "CAD",
      province: "British Columbia",
      serviceAreas: ESTIMATOR_SERVICE_AREAS,
      services: version.configurations
        .map(({ serviceKey }) => ({
          serviceKey,
          questions: ESTIMATOR_QUESTIONS.filter((q) => q.serviceKey === serviceKey),
        }))
        .filter(({ serviceKey }) => enabled.has(serviceKey)),
      disclaimer: "Preliminary estimate only. This is not a quote, offer, booking, or guarantee.",
    };
  }
  async calculate(input: EstimatorCalculationInput, request: Request) {
    this.assertOrigin(request);
    await this.throttle(request);
    const keyHash = hash(input.idempotencyKey);
    const duplicate = await this.database.client.estimateResult.findUnique({
      where: { idempotencyKeyHash: keyHash },
    });
    if (duplicate) return this.replay(duplicate);
    const normalized = stableInput(input);
    this.validateAnswers(normalized);
    const version = await this.activeVersion();
    const configuration = version.configurations.find(
      ({ serviceKey }) => serviceKey === input.serviceKey,
    );
    if (!configuration)
      throw new BadRequestException({
        code: "SERVICE_NOT_ESTIMATABLE",
        message: "This service is not currently available in the estimator.",
      });
    const result = calculatePreliminaryEstimate(
      this.definition(configuration),
      normalized as CalculationInput,
    );
    for (let tokenAttempt = 0; tokenAttempt < 3; tokenAttempt += 1) {
      const rawToken = token();
      try {
        const created = await this.database.client.estimateResult.create({
          data: {
            publicTokenHash: hash(rawToken),
            idempotencyKeyHash: keyHash,
            inputFingerprint: hash(JSON.stringify(normalized)),
            sourceHash: hash(`${request.ip}|${request.get("user-agent") ?? "unknown"}`),
            serviceKey: input.serviceKey,
            customerType: input.customerType,
            serviceAreaKey: input.serviceAreaKey,
            outcome: result.outcome,
            minimumCents: result.minimumCents,
            maximumCents: result.maximumCents,
            pricingVersionId: version.id,
            pricingVersionCode: version.versionCode,
            normalizedInput: json(normalized),
            publicExplanation: json(result.publicDrivers),
            calculationTrace: json(result.trace),
            assumptionsSnapshot: json(configuration.assumptions),
            exclusionsSnapshot: json(configuration.exclusions),
            disclaimerSnapshot: configuration.customerDisclaimer,
            expiresAt: new Date(Date.now() + this.config.ESTIMATOR_RESULT_TTL_SECONDS * 1000),
          },
        });
        await this.audit.record({
          action: "estimator.calculated",
          resourceType: "estimate-result",
          resourceId: created.id,
          metadata: {
            serviceKey: created.serviceKey,
            outcome: created.outcome,
            pricingVersionCode: created.pricingVersionCode,
          },
        });
        return { token: rawToken, result: this.safeResult(created), alreadyCalculated: false };
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          const found = await this.database.client.estimateResult.findUnique({
            where: { idempotencyKeyHash: keyHash },
          });
          if (found) return this.replay(found);
          if (tokenAttempt < 2) continue;
        }
        throw error;
      }
    }
    throw new ServiceUnavailableException({
      code: "RESULT_TOKEN_UNAVAILABLE",
      message: "A secure result link could not be created. Please try again.",
    });
  }
  private safeResult(result: {
    serviceKey: string;
    customerType: string;
    serviceAreaKey: string;
    outcome: string;
    minimumCents: number | null;
    maximumCents: number | null;
    currency: string;
    pricingVersionCode: string;
    publicExplanation: Prisma.JsonValue;
    assumptionsSnapshot: Prisma.JsonValue;
    exclusionsSnapshot: Prisma.JsonValue;
    disclaimerSnapshot: string;
    createdAt: Date;
    expiresAt: Date;
  }) {
    return {
      serviceKey: result.serviceKey,
      customerType: result.customerType,
      serviceAreaKey: result.serviceAreaKey,
      outcome: result.outcome,
      minimumCents: result.minimumCents,
      maximumCents: result.maximumCents,
      currency: result.currency,
      pricingVersionCode: result.pricingVersionCode,
      publicDrivers: result.publicExplanation,
      assumptions: result.assumptionsSnapshot,
      exclusions: result.exclusionsSnapshot,
      disclaimer: result.disclaimerSnapshot,
      createdAt: result.createdAt.toISOString(),
      expiresAt: result.expiresAt.toISOString(),
    };
  }
  private async replay(result: Parameters<EstimatorService["safeResult"]>[0] & { id: string }) {
    const rawToken = token();
    await this.database.client.estimateResult.update({
      where: { id: result.id },
      data: { publicTokenHash: hash(rawToken) },
    });
    return { token: rawToken, result: this.safeResult(result), alreadyCalculated: true };
  }
  async publicResult(rawToken: string) {
    const result = await this.database.client.estimateResult.findUnique({
      where: { publicTokenHash: hash(rawToken) },
    });
    if (!result || result.archivedAt || result.expiresAt <= new Date())
      throw new NotFoundException({
        code: "ESTIMATE_NOT_FOUND",
        message: "This estimate is unavailable or has expired.",
      });
    return this.safeResult(result);
  }
  async createTransfer(rawToken: string, request: Request) {
    this.assertOrigin(request);
    await this.throttle(request);
    const result = await this.database.client.estimateResult.findUnique({
      where: { publicTokenHash: hash(rawToken) },
    });
    if (!result || result.archivedAt || result.expiresAt <= new Date())
      throw new NotFoundException({
        code: "ESTIMATE_NOT_FOUND",
        message: "This estimate is unavailable or has expired.",
      });
    const rawTransfer = token();
    const expiresAt = new Date(Date.now() + this.config.ESTIMATOR_TRANSFER_TTL_SECONDS * 1000);
    await this.database.client.estimateResult.update({
      where: { id: result.id },
      data: { transferTokenHash: hash(rawTransfer), transferTokenExpiresAt: expiresAt },
    });
    return {
      transferToken: rawTransfer,
      expiresAt: expiresAt.toISOString(),
      quotePath: `/request-a-quote?estimate=${encodeURIComponent(rawTransfer)}`,
    };
  }
  async transferDetails(rawToken: string) {
    const result = await this.database.client.estimateResult.findUnique({
      where: { transferTokenHash: hash(rawToken) },
    });
    if (
      !result ||
      !result.transferTokenExpiresAt ||
      result.transferTokenExpiresAt <= new Date() ||
      result.expiresAt <= new Date()
    )
      throw new NotFoundException({
        code: "TRANSFER_NOT_FOUND",
        message: "This estimate transfer is unavailable or has expired.",
      });
    const input = result.normalizedInput as {
      serviceKey: string;
      customerType: string;
      serviceAreaKey: string;
      answers: Record<string, EstimatorAnswer>;
    };
    const mapping = Object.fromEntries(
      ESTIMATOR_QUESTIONS.filter((q) => q.serviceKey === input.serviceKey && q.quoteQuestionKey)
        .map((q) => [q.quoteQuestionKey!, input.answers[q.key]])
        .filter(([, value]) => value !== undefined),
    );
    return {
      serviceKey: input.serviceKey,
      propertyType: input.customerType,
      serviceAreaKey: input.serviceAreaKey,
      serviceAnswers: mapping,
      estimate: this.safeResult(result),
    };
  }

  versions() {
    return this.database.client.pricingVersion.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { configurations: true, estimates: true } } },
    });
  }
  async version(id: string) {
    const version = await this.database.client.pricingVersion.findUnique({
      where: { id },
      include: {
        configurations: {
          include: { rules: { orderBy: [{ sortOrder: "asc" }, { ruleKey: "asc" }] } },
          orderBy: { displayOrder: "asc" },
        },
      },
    });
    if (!version)
      throw new NotFoundException({
        code: "PRICING_VERSION_NOT_FOUND",
        message: "Pricing version not found.",
      });
    return version;
  }
  async diff(id: string) {
    const current = await this.version(id);
    const previous = await this.database.client.pricingVersion.findFirst({
      where: { id: { not: id }, status: { in: ["PUBLISHED", "ARCHIVED"] } },
      include: { configurations: { include: { rules: true } } },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });
    if (!previous)
      return {
        against: null,
        services: current.configurations.map(({ serviceKey }) => ({ serviceKey, change: "ADDED" })),
      };
    const comparable = (configuration: (typeof current.configurations)[number] | undefined) =>
      configuration
        ? {
            enabled: configuration.enabled,
            baseMinimumCents: configuration.baseMinimumCents,
            baseMaximumCents: configuration.baseMaximumCents,
            minimumChargeCents: configuration.minimumChargeCents,
            maximumEstimatorCents: configuration.maximumEstimatorCents,
            roundingIncrementCents: configuration.roundingIncrementCents,
            rules: configuration.rules.map(
              ({
                ruleKey,
                questionKey,
                ruleType,
                conditionOperator,
                comparisonValue,
                minimumAdjustmentCents,
                maximumAdjustmentCents,
                adjustmentBasisPoints,
                sortOrder,
                enabled,
                publicLabel,
              }) => ({
                ruleKey,
                questionKey,
                ruleType,
                conditionOperator,
                comparisonValue,
                minimumAdjustmentCents,
                maximumAdjustmentCents,
                adjustmentBasisPoints,
                sortOrder,
                enabled,
                publicLabel,
              }),
            ),
          }
        : null;
    return {
      against: { id: previous.id, versionCode: previous.versionCode },
      services: current.configurations.map((configuration) => {
        const before = comparable(
          previous.configurations.find(
            ({ serviceKey }) => serviceKey === configuration.serviceKey,
          ) as (typeof current.configurations)[number] | undefined,
        );
        const after = comparable(configuration);
        return {
          serviceKey: configuration.serviceKey,
          changed: JSON.stringify(before) !== JSON.stringify(after),
          before,
          after,
        };
      }),
    };
  }
  async createVersion(input: PricingVersionCreateInput, actor: string) {
    const created = await this.database.client.$transaction(async (tx) => {
      const version = await tx.pricingVersion.create({
        data: {
          versionCode: input.versionCode,
          name: input.name,
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          createdByUserId: actor,
          updatedByUserId: actor,
        },
      });
      if (input.cloneFromVersionId) {
        const source = await tx.pricingVersion.findUnique({
          where: { id: input.cloneFromVersionId },
          include: { configurations: { include: { rules: true } } },
        });
        if (!source)
          throw new BadRequestException({
            code: "CLONE_SOURCE_NOT_FOUND",
            message: "Clone source was not found.",
          });
        for (const config of source.configurations) {
          const cloned = await tx.servicePricingConfiguration.create({
            data: {
              pricingVersionId: version.id,
              serviceKey: config.serviceKey,
              enabled: config.enabled,
              baseMinimumCents: config.baseMinimumCents,
              baseMaximumCents: config.baseMaximumCents,
              minimumChargeCents: config.minimumChargeCents,
              maximumEstimatorCents: config.maximumEstimatorCents,
              roundingIncrementCents: config.roundingIncrementCents,
              displayOrder: config.displayOrder,
              customerDisclaimer: config.customerDisclaimer,
              assumptions: config.assumptions as Prisma.InputJsonValue,
              exclusions: config.exclusions as Prisma.InputJsonValue,
            },
          });
          if (config.rules.length)
            await tx.pricingRule.createMany({
              data: config.rules.map((rule) => ({
                servicePricingConfigurationId: cloned.id,
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
                internalDescription: rule.internalDescription,
              })),
            });
        }
      }
      return version;
    });
    await this.audit.record({
      actorUserId: actor,
      action: input.cloneFromVersionId ? "pricing-version.cloned" : "pricing-version.created",
      resourceType: "pricing-version",
      resourceId: created.id,
      metadata: { versionCode: created.versionCode },
    });
    return created;
  }
  async updateVersion(id: string, input: PricingVersionUpdateInput, actor: string) {
    const current = await this.version(id);
    this.assertDraft(current.status);
    const updated = await this.database.client.pricingVersion.updateMany({
      where: { id, version: input.version, status: "DRAFT" },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
        ...(input.effectiveFrom !== undefined
          ? { effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null }
          : {}),
        ...(input.effectiveTo !== undefined
          ? { effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null }
          : {}),
        updatedByUserId: actor,
        version: { increment: 1 },
      },
    });
    if (!updated.count)
      throw new ConflictException({
        code: "STALE_PRICING_VERSION",
        message: "This draft changed. Refresh and try again.",
      });
    await this.audit.record({
      actorUserId: actor,
      action: "pricing-version.updated",
      resourceType: "pricing-version",
      resourceId: id,
    });
    return this.version(id);
  }
  async configureService(
    id: string,
    serviceKey: string,
    input: ServicePricingConfigurationInput,
    actor: string,
  ) {
    if (serviceKey !== input.serviceKey)
      throw new BadRequestException({
        code: "SERVICE_KEY_MISMATCH",
        message: "Service keys do not match.",
      });
    const version = await this.version(id);
    this.assertDraft(version.status);
    const validation = validatePricingDefinition({ ...input, rules: [] });
    if (validation.length)
      throw new BadRequestException({
        code: "INVALID_PRICING_CONFIGURATION",
        message: validation.join(" "),
      });
    await this.database.client.servicePricingConfiguration.upsert({
      where: { pricingVersionId_serviceKey: { pricingVersionId: id, serviceKey } },
      create: {
        pricingVersionId: id,
        ...input,
        assumptions: json(input.assumptions),
        exclusions: json(input.exclusions),
      },
      update: {
        ...input,
        assumptions: json(input.assumptions),
        exclusions: json(input.exclusions),
      },
    });
    await this.touch(id, actor, "pricing-service.updated");
    return this.version(id);
  }
  async upsertRule(id: string, serviceKey: string, input: PricingRuleInput, actor: string) {
    const version = await this.version(id);
    this.assertDraft(version.status);
    const configuration = version.configurations.find((item) => item.serviceKey === serviceKey);
    if (!configuration)
      throw new NotFoundException({
        code: "SERVICE_CONFIGURATION_NOT_FOUND",
        message: "Configure this service first.",
      });
    const known =
      ESTIMATOR_QUESTIONS.some((q) => q.serviceKey === serviceKey && q.key === input.questionKey) ||
      ["customerType", "serviceAreaKey"].includes(input.questionKey);
    if (!known)
      throw new BadRequestException({
        code: "UNKNOWN_PRICING_QUESTION",
        message: "The pricing rule references an unknown question.",
      });
    const ruleData = {
      ruleKey: input.ruleKey,
      questionKey: input.questionKey,
      ruleType: input.ruleType,
      conditionOperator: input.conditionOperator,
      ...(input.comparisonValue !== undefined
        ? { comparisonValue: json(input.comparisonValue) }
        : {}),
      ...(input.minimumAdjustmentCents !== undefined
        ? { minimumAdjustmentCents: input.minimumAdjustmentCents }
        : {}),
      ...(input.maximumAdjustmentCents !== undefined
        ? { maximumAdjustmentCents: input.maximumAdjustmentCents }
        : {}),
      ...(input.adjustmentBasisPoints !== undefined
        ? { adjustmentBasisPoints: input.adjustmentBasisPoints }
        : {}),
      sortOrder: input.sortOrder,
      enabled: input.enabled,
      publicLabel: input.publicLabel,
      ...(input.internalDescription !== undefined
        ? { internalDescription: input.internalDescription }
        : {}),
    };
    await this.database.client.pricingRule.upsert({
      where: {
        servicePricingConfigurationId_ruleKey: {
          servicePricingConfigurationId: configuration.id,
          ruleKey: input.ruleKey,
        },
      },
      create: { servicePricingConfigurationId: configuration.id, ...ruleData },
      update: ruleData,
    });
    await this.touch(id, actor, "pricing-rule.updated");
    return this.version(id);
  }
  async removeRule(id: string, ruleId: string, actor: string) {
    const version = await this.version(id);
    this.assertDraft(version.status);
    const removed = await this.database.client.pricingRule.deleteMany({
      where: { id: ruleId, servicePricingConfiguration: { pricingVersionId: id } },
    });
    if (!removed.count)
      throw new NotFoundException({
        code: "PRICING_RULE_NOT_FOUND",
        message: "Pricing rule not found.",
      });
    await this.touch(id, actor, "pricing-rule.deleted");
    return { success: true };
  }
  async preview(id: string, input: PricingPreviewInput) {
    this.validateAnswers(input);
    const version = await this.version(id);
    const configuration = version.configurations.find(
      ({ serviceKey }) => serviceKey === input.serviceKey,
    );
    if (!configuration)
      throw new BadRequestException({
        code: "SERVICE_NOT_CONFIGURED",
        message: "Service is not configured.",
      });
    return calculatePreliminaryEstimate(
      this.definition(configuration as never),
      input as CalculationInput,
    );
  }
  async publish(id: string, actor: string) {
    const version = await this.version(id);
    this.assertDraft(version.status);
    if (!version.effectiveFrom)
      throw new BadRequestException({
        code: "EFFECTIVE_DATE_REQUIRED",
        message: "An effective date is required.",
      });
    if (version.configurations.length !== 5)
      throw new BadRequestException({
        code: "INCOMPLETE_PRICING_VERSION",
        message: "All five service configurations are required.",
      });
    for (const configuration of version.configurations) {
      const errors = validatePricingDefinition(this.definition(configuration as never));
      if (errors.length)
        throw new BadRequestException({
          code: "INVALID_PRICING_CONFIGURATION",
          message: `${configuration.serviceKey}: ${errors.join(" ")}`,
        });
    }
    await this.database.client.$transaction(
      async (transaction) => {
        const overlap = await transaction.pricingVersion.findFirst({
          where: {
            id: { not: id },
            status: "PUBLISHED",
            AND: [
              { OR: [{ effectiveTo: null }, { effectiveTo: { gt: version.effectiveFrom! } }] },
              ...(version.effectiveTo ? [{ effectiveFrom: { lt: version.effectiveTo } }] : []),
            ],
          },
        });
        if (overlap)
          throw new ConflictException({
            code: "PRICING_EFFECTIVE_OVERLAP",
            message: "The effective period overlaps a published version. End or archive it first.",
          });
        const updated = await transaction.pricingVersion.updateMany({
          where: { id, status: "DRAFT", version: version.version },
          data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
            updatedByUserId: actor,
            version: { increment: 1 },
          },
        });
        if (!updated.count)
          throw new ConflictException({
            code: "STALE_PRICING_VERSION",
            message: "This draft changed. Refresh and validate it again.",
          });
      },
      { isolationLevel: "Serializable" },
    );
    await this.audit.record({
      actorUserId: actor,
      action: "pricing-version.published",
      resourceType: "pricing-version",
      resourceId: id,
      metadata: { versionCode: version.versionCode },
    });
    return this.version(id);
  }
  async archiveVersion(id: string, actor: string) {
    const version = await this.version(id);
    if (version.status === "ARCHIVED") return version;
    const now = new Date();
    await this.database.client.pricingVersion.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: now,
        effectiveTo: version.effectiveTo ?? now,
        updatedByUserId: actor,
        version: { increment: 1 },
      },
    });
    await this.audit.record({
      actorUserId: actor,
      action: "pricing-version.archived",
      resourceType: "pricing-version",
      resourceId: id,
    });
    return this.version(id);
  }
  async removeVersion(id: string, actor: string) {
    const version = await this.version(id);
    if (version.status !== "DRAFT")
      throw new ConflictException({
        code: "PRICING_VERSION_NOT_DELETABLE",
        message: "Only unreferenced drafts may be deleted.",
      });
    await this.database.client.pricingVersion.delete({ where: { id } });
    await this.audit.record({
      actorUserId: actor,
      action: "pricing-version.deleted",
      resourceType: "pricing-version",
      resourceId: id,
      metadata: { versionCode: version.versionCode },
    });
    return { success: true };
  }
  async results(query: EstimatorResultListQuery) {
    const where: Prisma.EstimateResultWhereInput = {
      archivedAt: query.archived ? { not: null } : null,
      ...(query.serviceKey ? { serviceKey: query.serviceKey } : {}),
      ...(query.outcome ? { outcome: query.outcome } : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.estimateResult.findMany({
        where,
        omit: {
          publicTokenHash: true,
          transferTokenHash: true,
          idempotencyKeyHash: true,
          sourceHash: true,
          calculationTrace: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.database.client.estimateResult.count({ where }),
    ]);
    return { items, pagination: { page: query.page, pageSize: query.pageSize, total } };
  }
  async adminResult(id: string, includeTrace: boolean) {
    const result = await this.database.client.estimateResult.findUnique({
      where: { id },
      omit: {
        publicTokenHash: true,
        transferTokenHash: true,
        idempotencyKeyHash: true,
        sourceHash: true,
        ...(includeTrace ? {} : { calculationTrace: true }),
      },
      include: {
        quoteRequest: { select: { id: true, reference: true, estimateMatchStatus: true } },
      },
    });
    if (!result)
      throw new NotFoundException({
        code: "ESTIMATE_RESULT_NOT_FOUND",
        message: "Estimate result not found.",
      });
    return result;
  }
  async archiveResult(id: string, actor: string) {
    const updated = await this.database.client.estimateResult.updateMany({
      where: { id },
      data: { archivedAt: new Date() },
    });
    if (!updated.count)
      throw new NotFoundException({
        code: "ESTIMATE_RESULT_NOT_FOUND",
        message: "Estimate result not found.",
      });
    await this.audit.record({
      actorUserId: actor,
      action: "estimator-result.archived",
      resourceType: "estimate-result",
      resourceId: id,
    });
    return { success: true };
  }
  private assertDraft(status: string) {
    if (status !== "DRAFT")
      throw new ConflictException({
        code: "PUBLISHED_PRICING_IMMUTABLE",
        message:
          "Published and archived pricing versions are immutable. Clone one to create a draft.",
      });
  }
  private async touch(id: string, actor: string, action: string) {
    await this.database.client.pricingVersion.update({
      where: { id },
      data: { updatedByUserId: actor, version: { increment: 1 } },
    });
    await this.audit.record({
      actorUserId: actor,
      action,
      resourceType: "pricing-version",
      resourceId: id,
    });
  }
}
