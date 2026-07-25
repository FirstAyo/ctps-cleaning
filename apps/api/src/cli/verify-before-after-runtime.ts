import { randomBytes } from "node:crypto";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { prisma } from "@ctps/database";
import { ROLE_KEYS } from "@ctps/permissions";
import sharp from "sharp";

import { createApiApplication } from "../api-application";
import { PasswordService } from "../auth/password.service";
import { initializeSystemAccess } from "../auth/system-access";

const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const email = "phase5-runtime-super@invalid.example";
const limitedEmail = "phase5-runtime-limited@invalid.example";
const password = `${randomBytes(24).toString("base64url")} test A1`;
const projectSlug = `phase5-runtime-${Date.now()}`;
const mediaIds: string[] = [];
const userIds: string[] = [];
let projectId: string | undefined;
let api: INestApplication | undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function json(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: { accept: "application/json", ...init.headers },
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { response, body };
}

function sessionCookie(response: Response) {
  const header = response.headers.get("set-cookie");
  assert(header, "Expected a session cookie");
  return header.split(";", 1)[0]!;
}

async function csrf(cookie: string) {
  const result = await json("auth/csrf", { headers: { cookie } });
  assert(result.response.ok && typeof result.body.csrfToken === "string", "CSRF issuance failed");
  return result.body.csrfToken;
}

async function mutate(path: string, method: string, cookie: string, body: unknown) {
  return json(path, {
    method,
    headers: {
      "content-type": "application/json",
      cookie,
      "x-csrf-token": await csrf(cookie),
    },
    body: JSON.stringify(body),
  });
}

async function createRuntimeUser(roleKey: string, runtimeEmail: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const user = await prisma.user.create({
    data: {
      email: runtimeEmail,
      displayName: `Phase 5 Runtime ${roleKey}`,
      passwordHash: await new PasswordService().hash(password),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      roles: { create: { roleId: role.id } },
    },
  });
  userIds.push(user.id);
  return user;
}

async function login(runtimeEmail: string) {
  const result = await json("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: runtimeEmail, password }),
  });
  assert(result.response.ok, `Runtime login failed for ${runtimeEmail}`);
  return sessionCookie(result.response);
}

async function main() {
  await prisma.$connect();
  await initializeSystemAccess(prisma);
  await prisma.user.deleteMany({ where: { email: { in: [email, limitedEmail] } } });
  await createRuntimeUser(ROLE_KEYS.SUPER_ADMIN, email);
  await createRuntimeUser(ROLE_KEYS.ADMIN, limitedEmail);

  const created = await createApiApplication();
  api = created.app;
  await api.listen(created.environment.API_PORT, "127.0.0.1");

  const unauthorized = await json("admin/media/before-after", { method: "POST" });
  assert(unauthorized.response.status === 401, "Unauthenticated upload did not return 401");
  const limitedCookie = await login(limitedEmail);
  const forbidden = await json("admin/before-after-projects?page=1&pageSize=20", {
    headers: { cookie: limitedCookie },
  });
  assert(forbidden.response.status === 403, "Limited Admin unexpectedly managed projects");

  const cookie = await login(email);
  const missingCsrf = await json("admin/before-after-projects", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: "{}",
  });
  assert(
    missingCsrf.response.status === 403 && missingCsrf.body.code === "CSRF_VALIDATION_FAILED",
    "Project mutation accepted a missing CSRF token",
  );

  const uploadBody = new FormData();
  for (const [name, colour] of [
    ["before.jpg", "#73533c"],
    ["after.jpg", "#a9d8f5"],
    ["support.jpg", "#d7e8c4"],
  ] as const) {
    const data = await sharp({
      create: { width: 900, height: 600, channels: 3, background: colour },
    })
      .jpeg({ quality: 90 })
      .toBuffer();
    uploadBody.append("files", new Blob([data], { type: "image/jpeg" }), name);
  }
  const uploadResponse = await fetch(`${base}/admin/media/before-after`, {
    method: "POST",
    headers: { accept: "application/json", cookie, "x-csrf-token": await csrf(cookie) },
    body: uploadBody,
  });
  const upload = (await uploadResponse.json()) as {
    items: { id: string; variants: unknown[] }[];
  };
  assert(uploadResponse.ok && upload.items.length === 3, "Multiple-image runtime upload failed");
  mediaIds.push(...upload.items.map(({ id }) => id));
  assert(
    !/storageKey|privateRoot|publicRoot|storage\\|storage\//i.test(JSON.stringify(upload)),
    "Upload response exposed internal storage metadata",
  );

  for (const [index, altText] of [
    "Exterior window before professional cleaning",
    "Exterior window after professional cleaning",
    "Clean frame during final inspection",
  ].entries()) {
    const updated = await mutate(`admin/media/before-after/${mediaIds[index]}`, "PATCH", cookie, {
      altText,
      caption: index === 2 ? "Final inspection" : null,
    });
    assert(updated.response.ok, "Runtime alt text/caption update failed");
  }

  const draft = await mutate("admin/before-after-projects", "POST", cookie, {
    title: "Runtime window restoration",
    slug: projectSlug,
    summary: "A disposable project used to verify the complete managed-media lifecycle.",
    description: "This record is created only for local Phase 5 runtime verification.",
    serviceKey: "window-cleaning",
    serviceAreaKey: "vancouver",
    completedAt: "2026-07-01T00:00:00.000Z",
    seoTitle: "Runtime window restoration",
    seoDescription: "Disposable Phase 5 runtime verification project.",
    featured: true,
    primaryBeforeMediaId: mediaIds[0],
    primaryAfterMediaId: mediaIds[1],
    supportingMedia: [
      { mediaId: mediaIds[2], category: "GALLERY", sortOrder: 0, caption: "Final inspection" },
    ],
  });
  assert(draft.response.ok && draft.body.status === "DRAFT", "Draft project creation failed");
  projectId = String(draft.body.id);

  const draftPublic = await json(`public/before-after-projects/${projectSlug}`);
  assert(draftPublic.response.status === 404, "Draft project was publicly visible");
  const privatePreview = await fetch(`${base}/admin/media/before-after/${mediaIds[0]}/gallery`, {
    headers: { cookie },
  });
  assert(
    privatePreview.ok && privatePreview.headers.get("cache-control") === "private, no-store",
    "Protected Draft preview failed",
  );
  assert(
    (await fetch(`${base}/media/before-after/${mediaIds[0]}/gallery`)).status === 404,
    "Draft media was publicly accessible",
  );

  const publication = await mutate(
    `admin/before-after-projects/${projectId}/publish`,
    "POST",
    cookie,
    {},
  );
  assert(publication.response.ok && publication.body.status === "PUBLISHED", "Publication failed");
  const publicDetail = await json(`public/before-after-projects/${projectSlug}`);
  assert(publicDetail.response.ok, "Published detail was unavailable");
  assert(
    !/storageKey|privateRoot|publicRoot|storage\\|storage\//i.test(
      JSON.stringify(publicDetail.body),
    ),
    "Public detail exposed internal storage metadata",
  );
  const publicMedia = await fetch(`${base}/media/before-after/${mediaIds[0]}/gallery`);
  assert(
    publicMedia.ok && publicMedia.headers.get("content-type") === "image/webp",
    "Published media delivery failed",
  );

  const unpublish = await mutate(
    `admin/before-after-projects/${projectId}/unpublish`,
    "POST",
    cookie,
    {},
  );
  assert(unpublish.response.ok && unpublish.body.status === "DRAFT", "Unpublishing failed");
  assert(
    (await json(`public/before-after-projects/${projectSlug}`)).response.status === 404,
    "Unpublished project remained public",
  );
  assert(
    (await fetch(`${base}/media/before-after/${mediaIds[0]}/gallery`)).status === 404,
    "Unpublished media remained public",
  );

  const events = await prisma.auditLog.findMany({
    where: { actorUserId: userIds[0]!, action: { startsWith: "before_after_" } },
    select: { action: true, metadata: true },
  });
  assert(
    events.some(({ action }) => action === "before_after_project.published") &&
      events.some(({ action }) => action === "before_after_project.unpublished"),
    "Expected lifecycle audit events were missing",
  );
  assert(
    !/storageKey|privateRoot|publicRoot|filePath/i.test(JSON.stringify(events)),
    "Audit events exposed internal storage paths",
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        auditEvents: events.length,
        csrf: true,
        draftPrivate: true,
        filesUploaded: mediaIds.length,
        permissions: { forbidden: true, unauthorized: true },
        publishedPublicly: true,
        storageMetadataHidden: true,
        unpublishedPrivate: true,
      },
      null,
      2,
    )}\n`,
  );
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(
      `${error instanceof Error ? error.stack : "Runtime verification failed"}\n`,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await api?.close();
    if (projectId)
      await prisma.beforeAfterProject
        .deleteMany({ where: { id: projectId } })
        .catch(() => undefined);
    if (mediaIds.length)
      await prisma.mediaAsset
        .deleteMany({ where: { id: { in: mediaIds } } })
        .catch(() => undefined);
    if (userIds.length) {
      await prisma.auditLog.deleteMany({
        where: { OR: [{ actorUserId: { in: userIds } }, { resourceId: { in: userIds } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    for (const root of [
      process.env.MEDIA_LOCAL_PRIVATE_ROOT ?? "storage/private/before-after",
      process.env.MEDIA_LOCAL_PUBLIC_ROOT ?? "storage/public/before-after",
    ])
      for (const id of mediaIds)
        await rm(resolve(process.cwd(), root, id), { recursive: true, force: true }).catch(
          () => undefined,
        );
    await prisma.$disconnect();
  });
