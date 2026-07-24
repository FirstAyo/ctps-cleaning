import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@ctps/database";

import { DatabaseService } from "../database/database.service";

const forbiddenMetadataKey = /password|token|secret|cookie|authorization|csrf|hash/i;

export function sanitizeAuditMetadata(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  const visit = (entry: unknown): unknown => {
    if (
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    )
      return entry;
    if (Array.isArray(entry)) return entry.map(visit);
    if (typeof entry === "object") {
      return Object.fromEntries(
        Object.entries(entry)
          .filter(([key]) => !forbiddenMetadataKey.test(key))
          .map(([key, child]) => [key, visit(child)]),
      );
    }
    return String(entry);
  };
  return visit(value) as Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async record(input: {
    readonly actorUserId?: string;
    readonly action: string;
    readonly resourceType: string;
    readonly resourceId?: string;
    readonly metadata?: unknown;
  }): Promise<void> {
    const metadata = sanitizeAuditMetadata(input.metadata);
    await this.database.client.auditLog.create({
      data: {
        action: input.action,
        resourceType: input.resourceType,
        ...(input.actorUserId ? { actorUserId: input.actorUserId } : {}),
        ...(input.resourceId ? { resourceId: input.resourceId } : {}),
        ...(metadata !== undefined ? { metadata } : {}),
      },
    });
  }
}
