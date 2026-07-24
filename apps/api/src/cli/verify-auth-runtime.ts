import { randomBytes } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { prisma } from "@ctps/database";
import { PERMISSION_KEYS, ROLE_KEYS } from "@ctps/permissions";

import { createInitialSuperAdmin } from "../auth/initial-super-admin";
import { PasswordService } from "../auth/password.service";
import { TokenService } from "../auth/token.service";
import { createApiApplication } from "../api-application";

const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const emails = {
  super: "phase3-runtime-super@invalid.example",
  admin: "phase3-runtime-admin@invalid.example",
  author: "phase3-runtime-author@invalid.example",
  unknown: "phase3-runtime-unknown@invalid.example",
};
const password = () => `${randomBytes(24).toString("base64url")} test A1`;
const createdIds: string[] = [];
let api: INestApplication | undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
async function call(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: { accept: "application/json", ...init.headers },
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { response, body };
}
function cookie(response: Response): string {
  const value = response.headers.get("set-cookie");
  assert(value, "Expected a session cookie");
  return value.split(";", 1)[0]!;
}
async function csrf(sessionCookie: string): Promise<string> {
  const result = await call("auth/csrf", { headers: { cookie: sessionCookie } });
  assert(result.response.ok && typeof result.body.csrfToken === "string", "CSRF issuance failed");
  return result.body.csrfToken;
}
async function mutate(path: string, method: string, sessionCookie: string, body: unknown) {
  const token = await csrf(sessionCookie);
  return call(path, {
    method,
    headers: { "content-type": "application/json", cookie: sessionCookie, "x-csrf-token": token },
    body: JSON.stringify(body),
  });
}
async function main() {
  await prisma.$connect();
  const existingSuper = await prisma.userRole.findFirst({
    where: { role: { key: ROLE_KEYS.SUPER_ADMIN } },
    select: { userId: true },
  });
  if (existingSuper)
    throw new Error(
      "Safe runtime verification requires a local database without an existing Super Admin.",
    );
  await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
  const superPassword = password();
  const superUser = await createInitialSuperAdmin(prisma, new PasswordService(), {
    email: emails.super,
    displayName: "Phase 3 Runtime Super",
    password: superPassword,
  });
  createdIds.push(superUser.id);
  await expectDuplicateBootstrap(superPassword);

  const createdApplication = await createApiApplication();
  api = createdApplication.app;
  await api.listen(createdApplication.environment.API_PORT, "127.0.0.1");

  assert((await call("auth/me")).response.status === 401, "Protected identity did not return 401");
  const invalid = await call("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: emails.super, password: "invalid credential" }),
  });
  assert(
    invalid.response.status === 401 && invalid.body.code === "AUTHENTICATION_FAILED",
    "Invalid login was not generic",
  );
  const login = await call("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: emails.super, password: superPassword }),
  });
  assert(login.response.ok, "Super Admin login failed");
  const superCookie = cookie(login.response);
  const serializedLogin = JSON.stringify(login.body);
  assert(
    !serializedLogin.includes(superPassword) &&
      !serializedLogin.includes(superCookie.split("=")[1]!),
    "Login exposed sensitive credentials",
  );
  const setCookie = login.response.headers.get("set-cookie")!;
  assert(
    /HttpOnly/i.test(setCookie) && /SameSite=Lax/i.test(setCookie),
    "Cookie flags are incomplete",
  );
  const stored = await prisma.session.findFirstOrThrow({
    where: { userId: superUser.id },
    select: { tokenHash: true },
  });
  assert(
    stored.tokenHash !== superCookie.split("=")[1] && /^[a-f0-9]{64}$/.test(stored.tokenHash),
    "Raw session token was stored",
  );
  const me = await call("auth/me", { headers: { cookie: superCookie } });
  assert(
    me.response.ok &&
      (me.body.user as { roleKeys: string[] }).roleKeys.includes(ROLE_KEYS.SUPER_ADMIN),
    "Current-user response failed",
  );

  const missingCsrf = await call("admin/roles", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: superCookie },
    body: JSON.stringify({
      key: "PHASE3_RUNTIME",
      displayName: "Phase 3 Runtime",
      description: "Disposable runtime role",
    }),
  });
  assert(
    missingCsrf.response.status === 403 && missingCsrf.body.code === "CSRF_VALIDATION_FAILED",
    "Missing CSRF was not rejected",
  );
  const roleCreate = await mutate("admin/roles", "POST", superCookie, {
    key: "PHASE3_RUNTIME",
    displayName: "Phase 3 Runtime",
    description: "Disposable runtime role",
  });
  assert(roleCreate.response.ok, "Custom role creation failed");
  const customRole = roleCreate.body as unknown as { id: string };
  const unknownPermission = await mutate(
    `admin/roles/${customRole.id}/permissions`,
    "PUT",
    superCookie,
    { permissionKeys: ["unknown.permission"] },
  );
  assert(unknownPermission.response.status === 409, "Unknown permission was accepted");
  const assignPermission = await mutate(
    `admin/roles/${customRole.id}/permissions`,
    "PUT",
    superCookie,
    { permissionKeys: [PERMISSION_KEYS.USERS_READ] },
  );
  assert(assignPermission.response.ok, "Permission assignment failed");

  const roles = await call("admin/roles", { headers: { cookie: superCookie } });
  const roleList = roles.body as unknown as { id: string; key: string }[];
  const adminRole = roleList.find((role) => role.key === ROLE_KEYS.ADMIN)!;
  const authorRole = roleList.find((role) => role.key === ROLE_KEYS.AUTHOR)!;
  const createdAdmin = await mutate("admin/users", "POST", superCookie, {
    displayName: "Phase 3 Runtime Admin",
    email: emails.admin,
    roleIds: [adminRole.id],
  });
  assert(
    createdAdmin.response.ok && typeof createdAdmin.body.temporaryPassword === "string",
    "Temporary Admin creation failed",
  );
  const adminUser = createdAdmin.body.user as { id: string };
  createdIds.push(adminUser.id);
  const adminTemporaryPassword = String(createdAdmin.body.temporaryPassword);
  const adminLogin = await call("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: emails.admin, password: adminTemporaryPassword }),
  });
  let adminCookie = cookie(adminLogin.response);
  assert(
    (adminLogin.body.user as { mustChangePassword: boolean }).mustChangePassword,
    "Temporary user was not forced to change password",
  );
  const blockedBeforeChange = await call("admin/users", { headers: { cookie: adminCookie } });
  assert(
    blockedBeforeChange.response.status === 403 &&
      blockedBeforeChange.body.code === "PASSWORD_CHANGE_REQUIRED",
    "Mandatory password boundary failed",
  );
  const adminPassword = password();
  const changed = await mutate("auth/change-password", "POST", adminCookie, {
    currentPassword: adminTemporaryPassword,
    newPassword: adminPassword,
    confirmPassword: adminPassword,
  });
  assert(changed.response.ok, "Mandatory password change failed");
  adminCookie = cookie(changed.response);
  assert(
    (await call("admin/users", { headers: { cookie: adminCookie } })).response.status === 403,
    "Limited Admin unexpectedly accessed users",
  );

  const createdAuthor = await mutate("admin/users", "POST", superCookie, {
    displayName: "Phase 3 Runtime Author",
    email: emails.author,
    roleIds: [authorRole.id],
  });
  assert(createdAuthor.response.ok, "Author creation failed");
  const authorUser = createdAuthor.body.user as { id: string };
  createdIds.push(authorUser.id);
  const authorLogin = await call("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: emails.author,
      password: String(createdAuthor.body.temporaryPassword),
    }),
  });
  const authorCookie = cookie(authorLogin.response);
  assert(
    (await call("admin/roles", { headers: { cookie: authorCookie } })).response.status === 403,
    "Author unexpectedly accessed roles",
  );

  const assignRole = await mutate(`admin/users/${adminUser.id}/roles`, "PUT", superCookie, {
    roleIds: [adminRole.id, customRole.id],
  });
  assert(assignRole.response.ok, "User role assignment failed");
  assert(
    (await call("admin/users", { headers: { cookie: adminCookie } })).response.ok,
    "Combined role permission did not take effect",
  );
  const finalSuper = await mutate(`admin/users/${superUser.id}/disable`, "POST", superCookie, {});
  assert(
    finalSuper.response.status === 409 && finalSuper.body.code === "FINAL_SUPER_ADMIN",
    "Final Super Admin protection failed",
  );
  const disable = await mutate(`admin/users/${adminUser.id}/disable`, "POST", superCookie, {});
  assert(disable.response.ok, "Account disable failed");
  assert(
    (await call("auth/me", { headers: { cookie: adminCookie } })).response.status === 401,
    "Disabled account session remained valid",
  );
  const audits = await call("admin/audit-logs?page=1&pageSize=100", {
    headers: { cookie: superCookie },
  });
  assert(
    audits.response.ok && (audits.body as { total: number }).total > 0,
    "Audit events were not recorded",
  );

  for (let index = 0; index < 8; index += 1)
    await call("auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emails.unknown, password: "invalid credential" }),
    });
  const throttled = await call("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: emails.unknown, password: "invalid credential" }),
  });
  assert(
    throttled.response.status === 429 && throttled.body.code === "AUTHENTICATION_FAILED",
    "Durable login throttle failed",
  );
  const logout = await mutate("auth/logout", "POST", superCookie, {});
  assert(
    logout.response.ok &&
      (await call("auth/me", { headers: { cookie: superCookie } })).response.status === 401,
    "Logout did not revoke the session",
  );
  process.stdout.write(
    JSON.stringify(
      {
        audit: true,
        bootstrap: true,
        csrf: true,
        loginLogout: true,
        mandatoryPasswordChange: true,
        permissionMatrix: ["SUPER_ADMIN", "ADMIN", "AUTHOR"],
        sessionHashOnly: true,
        throttling: true,
      },
      null,
      2,
    ) + "\n",
  );
}

async function expectDuplicateBootstrap(superPassword: string) {
  let rejected = false;
  try {
    await createInitialSuperAdmin(prisma, new PasswordService(), {
      email: "phase3-duplicate@invalid.example",
      displayName: "Duplicate",
      password: superPassword,
    });
  } catch {
    rejected = true;
  }
  assert(rejected, "Bootstrap was not idempotently refused");
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.message : "Runtime verification failed"}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await api?.close();
    if (createdIds.length) {
      await prisma.auditLog.deleteMany({
        where: { OR: [{ actorUserId: { in: createdIds } }, { resourceId: { in: createdIds } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: createdIds } } });
    }
    await prisma.role.deleteMany({ where: { key: "PHASE3_RUNTIME" } });
    const tokens = new TokenService();
    await prisma.loginThrottle.deleteMany({
      where: {
        keyHash: {
          in: [
            tokens.hashToken(`127.0.0.1\0${emails.unknown}`),
            tokens.hashToken(`::ffff:127.0.0.1\0${emails.unknown}`),
          ],
        },
      },
    });
    await prisma.$disconnect();
  });
