import type { PrismaClient } from "@ctps/database";
import { ROLE_KEYS } from "@ctps/permissions";
import { displayNameSchema, normalizedEmailSchema, passwordSchema } from "@ctps/validation";

import type { PasswordService } from "./password.service";
import { initializeSystemAccess } from "./system-access";

export async function createInitialSuperAdmin(
  prisma: PrismaClient,
  passwords: PasswordService,
  rawInput: { email: string; displayName: string; password: string },
): Promise<{ id: string; email: string }> {
  const email = normalizedEmailSchema.parse(rawInput.email);
  const displayName = displayNameSchema.parse(rawInput.displayName);
  const password = passwordSchema.parse(rawInput.password);
  await initializeSystemAccess(prisma);
  const passwordHash = await passwords.hash(password);
  return prisma.$transaction(
    async (transaction) => {
      const role = await transaction.role.findUniqueOrThrow({
        where: { key: ROLE_KEYS.SUPER_ADMIN },
        select: { id: true },
      });
      if (await transaction.user.findUnique({ where: { email }, select: { id: true } }))
        throw new Error("A staff account already uses that email.");
      if (
        await transaction.userRole.findFirst({
          where: { roleId: role.id },
          select: { userId: true },
        })
      )
        throw new Error("A Super Admin already exists. Bootstrap is intentionally single-use.");
      const user = await transaction.user.create({
        data: { email, displayName, passwordHash, mustChangePassword: false },
        select: { id: true, email: true },
      });
      await transaction.userRole.create({
        data: { userId: user.id, roleId: role.id, assignedBy: user.id },
      });
      await transaction.auditLog.create({
        data: {
          actorUserId: user.id,
          action: "auth.super-admin.bootstrapped",
          resourceType: "user",
          resourceId: user.id,
          metadata: { source: "trusted-cli" },
        },
      });
      return user;
    },
    { isolationLevel: "Serializable" },
  );
}
