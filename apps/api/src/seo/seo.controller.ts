import { Controller, Get, Inject } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";

import { RequirePermissions } from "../auth/security.decorators";
import { SeoService } from "./seo.service";

@Controller("admin/seo")
export class SeoController {
  constructor(@Inject(SeoService) private readonly seo: SeoService) {}

  @Get("overview")
  @RequirePermissions(PERMISSION_KEYS.SEO_VIEW)
  overview() {
    return this.seo.overview();
  }
}
