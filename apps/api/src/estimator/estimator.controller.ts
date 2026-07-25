import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  estimatorCalculationSchema,
  estimatorResultListQuerySchema,
  identifierSchema,
  pricingPreviewSchema,
  pricingRuleSchema,
  pricingVersionCreateSchema,
  pricingVersionUpdateSchema,
  servicePricingConfigurationSchema,
  type EstimatorCalculationInput,
  type EstimatorResultListQuery,
  type PricingPreviewInput,
  type PricingRuleInput,
  type PricingVersionCreateInput,
  type PricingVersionUpdateInput,
  type ServicePricingConfigurationInput,
} from "@ctps/validation";
import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { EstimatorService } from "./estimator.service";

@Controller()
export class EstimatorController {
  constructor(@Inject(EstimatorService) private readonly estimator: EstimatorService) {}
  @Get("public/estimator/configuration") @PublicRoute() configuration() {
    return this.estimator.publicConfiguration();
  }
  @Post("public/estimator/calculate") @PublicRoute() calculate(
    @Body(new ZodValidationPipe(estimatorCalculationSchema)) body: EstimatorCalculationInput,
    @Req() request: Request,
  ) {
    return this.estimator.calculate(body, request);
  }
  @Get("public/estimator/results/:token") @PublicRoute() result(@Param("token") token: string) {
    return this.estimator.publicResult(token);
  }
  @Post("public/estimator/results/:token/quote-transfer") @PublicRoute() transfer(
    @Param("token") token: string,
    @Req() request: Request,
  ) {
    return this.estimator.createTransfer(token, request);
  }
  @Get("public/estimator/quote-transfer/:token") @PublicRoute() transferDetails(
    @Param("token") token: string,
  ) {
    return this.estimator.transferDetails(token);
  }

  @Get("admin/pricing/versions")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_READ)
  versions() {
    return this.estimator.versions();
  }
  @Post("admin/pricing/versions")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_CREATE)
  create(
    @Body(new ZodValidationPipe(pricingVersionCreateSchema)) body: PricingVersionCreateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.createVersion(body, actor.userId);
  }
  @Get("admin/pricing/versions/:id")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_READ)
  version(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.estimator.version(id);
  }
  @Get("admin/pricing/versions/:id/diff")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_READ)
  diff(@Param("id", new ZodValidationPipe(identifierSchema)) id: string) {
    return this.estimator.diff(id);
  }
  @Put("admin/pricing/versions/:id")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_UPDATE)
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(pricingVersionUpdateSchema)) body: PricingVersionUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.updateVersion(id, body, actor.userId);
  }
  @Put("admin/pricing/versions/:id/services/:serviceKey")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_UPDATE)
  configure(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("serviceKey") serviceKey: string,
    @Body(new ZodValidationPipe(servicePricingConfigurationSchema))
    body: ServicePricingConfigurationInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.configureService(id, serviceKey, body, actor.userId);
  }
  @Post("admin/pricing/versions/:id/services/:serviceKey/rules")
  @RequirePermissions(PERMISSION_KEYS.PRICING_RULES_CREATE)
  rule(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("serviceKey") serviceKey: string,
    @Body(new ZodValidationPipe(pricingRuleSchema)) body: PricingRuleInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.upsertRule(id, serviceKey, body, actor.userId);
  }
  @Delete("admin/pricing/versions/:id/rules/:ruleId")
  @RequirePermissions(PERMISSION_KEYS.PRICING_RULES_DELETE)
  removeRule(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("ruleId", new ZodValidationPipe(identifierSchema)) ruleId: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.removeRule(id, ruleId, actor.userId);
  }
  @Post("admin/pricing/versions/:id/preview")
  @RequirePermissions(PERMISSION_KEYS.PRICING_RULES_READ)
  preview(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(pricingPreviewSchema)) body: PricingPreviewInput,
  ) {
    return this.estimator.preview(id, body);
  }
  @Post("admin/pricing/versions/:id/publish")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_PUBLISH)
  publish(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.publish(id, actor.userId);
  }
  @Post("admin/pricing/versions/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_ARCHIVE)
  archiveVersion(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.archiveVersion(id, actor.userId);
  }
  @Delete("admin/pricing/versions/:id")
  @RequirePermissions(PERMISSION_KEYS.PRICING_VERSIONS_DELETE)
  removeVersion(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.removeVersion(id, actor.userId);
  }
  @Get("admin/estimator-results")
  @RequirePermissions(PERMISSION_KEYS.ESTIMATOR_RESULTS_READ)
  results(
    @Query(new ZodValidationPipe(estimatorResultListQuerySchema)) query: EstimatorResultListQuery,
  ) {
    return this.estimator.results(query);
  }
  @Get("admin/estimator-results/:id")
  @RequirePermissions(PERMISSION_KEYS.ESTIMATOR_RESULTS_READ)
  adminResult(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.adminResult(
      id,
      actor.permissions.includes(PERMISSION_KEYS.ESTIMATOR_RESULTS_READ_CALCULATION_TRACE),
    );
  }
  @Post("admin/estimator-results/:id/archive")
  @RequirePermissions(PERMISSION_KEYS.ESTIMATOR_RESULTS_ARCHIVE)
  archiveResult(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.estimator.archiveResult(id, actor.userId);
  }
}
