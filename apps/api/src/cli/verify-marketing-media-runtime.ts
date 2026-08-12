import { randomBytes } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { INestApplication } from "@nestjs/common";
import { prisma } from "@ctps/database";
import { ROLE_KEYS } from "@ctps/permissions";
import sharp from "sharp";

import { createApiApplication } from "../api-application";
import { PasswordService } from "../auth/password.service";
import { initializeSystemAccess } from "../auth/system-access";

const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const emails = [
  "phase11-media-super@invalid.example",
  "phase11-media-author@invalid.example",
] as const;
const password = `${randomBytes(24).toString("base64url")} test A1`;
const userIds: string[] = [];
let mediaId: string | undefined;
let application: INestApplication | undefined;

interface RuntimeVariant {
  path: string;
  width: number;
  height: number;
  sizeBytes: number;
  mimeType: string;
}
interface RuntimeMedia {
  id: string;
  title: string;
  altText: string;
  focalPointX: number;
  focalPointY: number;
  variants: Record<string, RuntimeVariant>;
}

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

async function mutate(path: string, method: string, cookie: string, body?: unknown) {
  return json(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      cookie,
      "x-csrf-token": await csrf(cookie),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function createRuntimeUser(roleKey: string, email: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const user = await prisma.user.create({
    data: {
      email,
      displayName: `Phase 11.1 Runtime ${roleKey}`,
      passwordHash: await new PasswordService().hash(password),
      mustChangePassword: false,
      passwordChangedAt: new Date(),
      roles: { create: { roleId: role.id } },
    },
  });
  userIds.push(user.id);
  return user;
}

async function login(email: string) {
  const result = await json("auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert(result.response.ok, `Runtime login failed for ${email}`);
  return sessionCookie(result.response);
}

async function largeDisposableJpeg() {
  const source = resolve(
    process.cwd(),
    "../../apps/web/public/images/phase-11/hero-courtyard.webp",
  );
  return sharp(await readFile(source))
    .resize(6000, 4000, { fit: "cover" })
    .withMetadata({
      orientation: 1,
      exif: { IFD0: { Copyright: "Phase 11.1 disposable runtime verification" } },
    })
    .jpeg({ quality: 99, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

async function main() {
  await prisma.$connect();
  await initializeSystemAccess(prisma);
  const previousUsers = await prisma.user.findMany({
    where: { email: { in: [...emails] } },
    select: { id: true },
  });
  const previousUserIds = previousUsers.map(({ id }) => id);
  await prisma.auditLog.deleteMany({ where: { actorUserId: { in: previousUserIds } } });
  await prisma.user.deleteMany({ where: { id: { in: previousUserIds } } });
  await createRuntimeUser(ROLE_KEYS.SUPER_ADMIN, emails[0]);
  await createRuntimeUser(ROLE_KEYS.AUTHOR, emails[1]);

  const created = await createApiApplication();
  application = created.app;
  await application.listen(created.environment.API_PORT, "127.0.0.1");

  const anonymous = await json("admin/media-library?page=1&pageSize=24");
  assert(anonymous.response.status === 401, "Anonymous Media Library request was not denied");
  const authorCookie = await login(emails[1]);
  const author = await json("admin/media-library?page=1&pageSize=24", {
    headers: { cookie: authorCookie },
  });
  assert(author.response.status === 403, "Author unexpectedly received Public Media access");

  const superCookie = await login(emails[0]);
  const input = await largeDisposableJpeg();
  assert(input.length > 5 * 1024 * 1024, "Runtime input was not a meaningful large upload");
  assert(input.length <= 10 * 1024 * 1024, "Runtime input exceeds the configured upload limit");
  const uploadBody = new FormData();
  uploadBody.append(
    "files",
    new Blob([new Uint8Array(input)], { type: "image/jpeg" }),
    "phase-11-1-large-runtime.jpg",
  );
  const uploadResponse = await fetch(`${base}/admin/media-library`, {
    method: "POST",
    headers: { cookie: superCookie, "x-csrf-token": await csrf(superCookie) },
    body: uploadBody,
  });
  const upload = (await uploadResponse.json()) as {
    items?: RuntimeMedia[];
    failures?: unknown[];
    message?: string;
  };
  assert(uploadResponse.ok, upload.message ?? "Runtime upload failed");
  assert(upload.items?.length === 1 && upload.failures?.length === 0, "Unexpected upload result");
  const asset = upload.items[0]!;
  mediaId = asset.id;
  for (const kind of ["original", "hero", "large", "standard", "card", "thumbnail"])
    assert(asset.variants[kind], `Missing ${kind} variant`);

  const update = await mutate(`admin/media-library/${asset.id}`, "PATCH", superCookie, {
    title: "Phase 11.1 disposable runtime media",
    altText: "Neutral courtyard used for disposable media verification",
    caption: "Disposable runtime verification",
    focalPointX: 37,
    focalPointY: 62,
  });
  assert(update.response.ok, "Media metadata/focal-point update failed");
  assert(
    update.body.focalPointX === 37 && update.body.focalPointY === 62,
    "Focal point was not saved",
  );

  const list = await json(
    "admin/media-library?page=1&pageSize=24&search=disposable&filter=RECENT&status=READY",
    { headers: { cookie: superCookie } },
  );
  const listed = list.body.items as Array<{ id: string }> | undefined;
  assert(
    list.response.ok && listed?.some(({ id }) => id === asset.id),
    "Uploaded media missing from search",
  );

  const privateIds = new Set(
    [
      ...(await prisma.quoteRequestUpload.findMany({ select: { id: true }, take: 20 })),
      ...(await prisma.serviceJobMedia.findMany({ select: { id: true }, take: 20 })),
      ...(await prisma.blogMediaAsset.findMany({
        where: { visibility: "PRIVATE" },
        select: { id: true },
        take: 20,
      })),
      ...(await prisma.mediaAsset.findMany({
        where: { visibility: "PRIVATE" },
        select: { id: true },
        take: 20,
      })),
    ].map(({ id }) => id),
  );
  assert(
    !listed?.some(({ id }) => privateIds.has(id)),
    "Private media crossed into Public Media results",
  );

  const home = await prisma.marketingPage.findUniqueOrThrow({ where: { pageKey: "HOME" } });
  await prisma.marketingPageMedia.createMany({
    data: [
      { pageId: home.id, mediaId: asset.id, usage: "DRAFT:RUNTIME:hero:0", sortOrder: 0 },
      { pageId: home.id, mediaId: asset.id, usage: "DRAFT:RUNTIME:final:0", sortOrder: 1 },
    ],
  });
  const usage = await json(`admin/media-library/${asset.id}/usage`, {
    headers: { cookie: superCookie },
  });
  const usages = usage.body.items as unknown[] | undefined;
  assert(usage.response.ok && usages?.length === 2, "Media reuse was not reported");
  const blockedDelete = await mutate(`admin/media-library/${asset.id}`, "DELETE", superCookie);
  assert(blockedDelete.response.status === 409, "Referenced media deletion was not blocked");

  const archive = await mutate(`admin/media-library/${asset.id}/archive`, "POST", superCookie, {});
  assert(archive.response.ok, "Media archive failed");
  const archivedFile = await fetch(`${base}/media/marketing/${asset.id}/hero`);
  assert(archivedFile.ok, "Archive broke an existing Published-capable variant");
  const restore = await mutate(`admin/media-library/${asset.id}/restore`, "POST", superCookie, {});
  assert(restore.response.ok, "Media restore failed");

  const originalResponse = await fetch(`${base}/media/marketing/${asset.id}/original`);
  assert(originalResponse.ok, "Optimized original delivery failed");
  const optimizedOriginal = Buffer.from(await originalResponse.arrayBuffer());
  const metadata = await sharp(optimizedOriginal).metadata();
  assert(!metadata.exif && !metadata.icc && !metadata.xmp, "Processed metadata was not stripped");
  assert(asset.variants.hero!.sizeBytes < input.length, "Hero compression was not meaningful");

  await prisma.marketingPageMedia.deleteMany({ where: { mediaId: asset.id } });
  const removed = await mutate(`admin/media-library/${asset.id}`, "DELETE", superCookie);
  assert(removed.response.ok, "Unreferenced media deletion failed");
  mediaId = undefined;

  console.log(
    JSON.stringify(
      {
        input: { width: 6000, height: 4000, sizeBytes: input.length },
        variants: asset.variants,
        metadataStripped: true,
        anonymousStatus: anonymous.response.status,
        authorStatus: author.response.status,
        searchFound: true,
        reuseReferences: usages.length,
        referencedDeleteStatus: blockedDelete.response.status,
        archivePreservedDelivery: true,
        runtimeMediaDeleted: true,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(
      error instanceof Error ? error.message : "Marketing media runtime verification failed",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mediaId) {
      await prisma.marketingPageMedia.deleteMany({ where: { mediaId } }).catch(() => undefined);
      await prisma.publicMediaAsset.delete({ where: { id: mediaId } }).catch(() => undefined);
      const root = resolve(
        process.cwd(),
        process.env.MARKETING_MEDIA_PUBLIC_ROOT ?? "../../storage/public/marketing",
      );
      await rm(resolve(root, mediaId), { recursive: true, force: true }).catch(() => undefined);
    }
    await prisma.auditLog
      .deleteMany({ where: { actorUserId: { in: userIds } } })
      .catch(() => undefined);
    await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => undefined);
    if (application) await application.close().catch(() => undefined);
    await prisma.$disconnect();
  });
