import { Controller, Get, Inject, Query } from "@nestjs/common";
import { PERMISSION_KEYS } from "@ctps/permissions";
import { auditListQuerySchema } from "@ctps/validation";

import { RequirePermissions } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { AuditLogsService } from "./audit-logs.service";

@Controller("admin/audit-logs")
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly logs: AuditLogsService) {}

  @Get()
  @RequirePermissions(PERMISSION_KEYS.AUDIT_READ)
  list(
    @Query(new ZodValidationPipe(auditListQuerySchema))
    query: {
      page: number;
      pageSize: number;
      actorUserId?: string;
      action?: string;
      resourceType?: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.logs.list(query);
  }
}
