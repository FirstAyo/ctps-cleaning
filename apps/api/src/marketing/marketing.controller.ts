import { Body, Controller, Get, Header, Inject, Param, Patch, Post } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import {
  identifierSchema,
  marketingPageKeySchema,
  marketingPageRestoreSchema,
  marketingPageUpdateSchema,
  navigationUpdateSchema,
  siteSettingsUpdateSchema,
  type MarketingPageRestoreInput,
  type MarketingPageUpdateInput,
  type NavigationUpdateInput,
  type SiteSettingsUpdateInput,
} from "@ctps/validation";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute, RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { MarketingService } from "./marketing.service";

@Controller()
export class MarketingController {
  constructor(@Inject(MarketingService) private readonly marketing: MarketingService) {}

  @Get("admin/pages")
  @RequirePermissions(PERMISSION_KEYS.PAGES_READ)
  list() {
    return this.marketing.list().then((items) => ({ items }));
  }

  @Get("admin/pages/:pageKey")
  @RequirePermissions(PERMISSION_KEYS.PAGES_READ)
  detail(@Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string) {
    return this.marketing.detail(pageKey);
  }

  @Patch("admin/pages/:pageKey")
  @RequirePermissions(PERMISSION_KEYS.PAGES_UPDATE)
  update(
    @Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string,
    @Body(new ZodValidationPipe(marketingPageUpdateSchema)) input: MarketingPageUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.marketing.update(
      pageKey,
      input,
      actor.userId,
      actor.permissions.includes(PERMISSION_KEYS.PAGES_MANAGE_SEO),
    );
  }

  @Post("admin/pages/:pageKey/publish")
  @RequirePermissions(PERMISSION_KEYS.PAGES_PUBLISH)
  publish(
    @Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string,
    @Body(new ZodValidationPipe(marketingPageRestoreSchema)) input: { version: number },
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.marketing.publish(pageKey, input.version, actor.userId);
  }

  @Get("admin/pages/:pageKey/preview")
  @RequirePermissions(PERMISSION_KEYS.PAGES_PREVIEW)
  @Header("Cache-Control", "private, no-store")
  @Header("X-Robots-Tag", "noindex, nofollow")
  preview(@Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string) {
    return this.marketing.detail(pageKey);
  }

  @Post("admin/pages/:pageKey/revisions/:revisionId/restore")
  @RequirePermissions(PERMISSION_KEYS.PAGES_PUBLISH)
  restore(
    @Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string,
    @Param("revisionId", new ZodValidationPipe(identifierSchema)) revisionId: string,
    @Body(new ZodValidationPipe(marketingPageRestoreSchema)) input: MarketingPageRestoreInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.marketing.restore(pageKey, revisionId, input, actor.userId);
  }

  @Get("admin/navigation")
  @RequirePermissions(PERMISSION_KEYS.NAVIGATION_READ)
  navigation() {
    return this.marketing.navigation().then((items) => ({ items }));
  }
  @Patch("admin/navigation")
  @RequirePermissions(PERMISSION_KEYS.NAVIGATION_UPDATE)
  updateNavigation(
    @Body(new ZodValidationPipe(navigationUpdateSchema)) input: NavigationUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.marketing.updateNavigation(input, actor.userId).then((items) => ({ items }));
  }

  @Get("admin/site-settings")
  @RequirePermissions(PERMISSION_KEYS.SITE_SETTINGS_READ)
  settings() {
    return this.marketing.settings();
  }
  @Patch("admin/site-settings")
  @RequirePermissions(PERMISSION_KEYS.SITE_SETTINGS_UPDATE)
  updateSettings(
    @Body(new ZodValidationPipe(siteSettingsUpdateSchema)) input: SiteSettingsUpdateInput,
    @CurrentIdentity() actor: AuthenticatedIdentity,
  ) {
    return this.marketing.updateSettings(input, actor.userId);
  }

  @Get("public/pages/:pageKey")
  @PublicRoute()
  published(@Param("pageKey", new ZodValidationPipe(marketingPageKeySchema)) pageKey: string) {
    return this.marketing.published(pageKey);
  }
  @Get("public/navigation")
  @PublicRoute()
  publicNavigation() {
    return this.marketing.navigation().then((items) => ({
      items: items.filter((item) => item.enabled).map(({ label, href }) => ({ label, href })),
    }));
  }
  @Get("public/site-settings")
  @PublicRoute()
  publicSettings() {
    return this.marketing.settings();
  }
}
