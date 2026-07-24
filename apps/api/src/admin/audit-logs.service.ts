import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from "../database/database.service";

@Injectable()
export class AuditLogsService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async list(query: {
    page: number;
    pageSize: number;
    actorUserId?: string;
    action?: string;
    resourceType?: string;
    from?: string;
    to?: string;
  }) {
    const where = {
      ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.resourceType ? { resourceType: query.resourceType } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await this.database.client.$transaction([
      this.database.client.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          metadata: true,
          createdAt: true,
          actor: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.database.client.auditLog.count({ where }),
    ]);
    return { items, page: query.page, pageSize: query.pageSize, total };
  }
}
