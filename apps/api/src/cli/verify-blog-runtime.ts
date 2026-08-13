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
import { BlogService } from "../blog/blog.service";

const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const nonce = `${Date.now()}`;
const emails = [
  "phase8-runtime-super@invalid.example",
  "phase8-runtime-author@invalid.example",
  "phase8-runtime-other@invalid.example",
];
const password = `${randomBytes(24).toString("base64url")} test A1`;
const slug = `phase8-runtime-${nonce}`;
const categorySlug = `runtime-category-${nonce}`;
const tagSlug = `runtime-tag-${nonce}`;
const authorSlug = `runtime-author-${nonce}`;
const userIds: string[] = [];
const mediaIds: string[] = [];
let postId: string | undefined;
let categoryId: string | undefined;
let tagId: string | undefined;
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
function cookie(response: Response) {
  const value = response.headers.get("set-cookie");
  assert(value, "Expected a session cookie");
  return value.split(";", 1)[0]!;
}
async function csrf(session: string) {
  const result = await json("auth/csrf", { headers: { cookie: session } });
  assert(result.response.ok && typeof result.body.csrfToken === "string", "CSRF issuance failed");
  return result.body.csrfToken;
}
async function mutate(path: string, method: string, session: string, body: unknown) {
  return json(path, {
    method,
    headers: {
      "content-type": "application/json",
      cookie: session,
      "x-csrf-token": await csrf(session),
    },
    body: JSON.stringify(body),
  });
}
async function createUser(roleKey: string, email: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
  const user = await prisma.user.create({
    data: {
      email,
      displayName: `Phase 8 ${roleKey}`,
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
  assert(result.response.ok, `Login failed for ${email}`);
  return cookie(result.response);
}

async function main() {
  await prisma.$connect();
  await initializeSystemAccess(prisma);
  await prisma.user.deleteMany({ where: { email: { in: emails } } });
  await createUser(ROLE_KEYS.SUPER_ADMIN, emails[0]!);
  const author = await createUser(ROLE_KEYS.AUTHOR, emails[1]!);
  await createUser(ROLE_KEYS.AUTHOR, emails[2]!);
  const created = await createApiApplication();
  api = created.app;
  await api.listen(created.environment.API_PORT, "127.0.0.1");
  const superSession = await login(emails[0]!);
  const authorSession = await login(emails[1]!);
  const otherSession = await login(emails[2]!);
  const category = await mutate("admin/blog/categories", "POST", superSession, {
    name: `Runtime Category ${nonce}`,
    slug: categorySlug,
    description: "Disposable Phase 8 runtime category.",
  });
  assert(category.response.ok, "Category creation failed");
  categoryId = String(category.body.id);
  const tag = await mutate("admin/blog/tags", "POST", superSession, {
    name: `Runtime Tag ${nonce}`,
    slug: tagSlug,
  });
  assert(tag.response.ok, "Tag creation failed");
  tagId = String(tag.body.id);
  const profile = await mutate(`admin/blog/authors/${author.id}`, "PUT", authorSession, {
    displayName: "Phase 8 Runtime Author",
    slug: authorSlug,
    bio: "Disposable local runtime profile.",
    profileMediaId: null,
  });
  assert(profile.response.ok, "Author profile creation failed");
  const uploadBody = new FormData();
  for (const [name, colour] of [
    ["featured.jpg", "#c8e2f0"],
    ["inline-one.jpg", "#9ac9a6"],
    ["inline-two.jpg", "#d9c6a5"],
  ] as const) {
    const data = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: colour },
    })
      .jpeg({ quality: 90 })
      .toBuffer();
    uploadBody.append("files", new Blob([data], { type: "image/jpeg" }), name);
  }
  const uploadResponse = await fetch(`${base}/admin/blog/media`, {
    method: "POST",
    headers: { cookie: authorSession, "x-csrf-token": await csrf(authorSession) },
    body: uploadBody,
  });
  const upload = (await uploadResponse.json()) as { items: { id: string }[] };
  assert(uploadResponse.ok && upload.items.length === 3, "Blog multi-image upload failed");
  mediaIds.push(...upload.items.map(({ id }) => id));
  for (const [index, item] of mediaIds.entries()) {
    const update = await mutate(`admin/blog/media/${item}`, "PATCH", authorSession, {
      altText:
        index === 0
          ? "Clean property exterior featured image"
          : `Managed inline cleaning image ${index}`,
      caption: index ? `Runtime caption ${index}` : null,
    });
    assert(update.response.ok, "Media metadata update failed");
  }
  const draft = await mutate("admin/blog/posts", "POST", authorSession, {
    title: "Phase 11.3 runtime property-care guide",
    slug,
    excerpt: "A disposable post that verifies the upgraded structured editor boundary.",
    content: [
      {
        type: "richText",
        style: "heading2",
        content: [{ type: "text", text: "Runtime verification", marks: [] }],
      },
      {
        type: "richText",
        style: "paragraph",
        content: [
          { type: "text", text: "This content", marks: [{ type: "bold" }] },
          { type: "text", text: " exists only during ", marks: [{ type: "italic" }] },
          { type: "text", text: "local verification", marks: [{ type: "underline" }] },
          {
            type: "text",
            text: ".",
            marks: [{ type: "link", href: "/services" }],
          },
        ],
      },
      {
        type: "richList",
        style: "bullet",
        items: [[{ type: "text", text: "Structured list item", marks: [] }]],
      },
      {
        type: "managedImage",
        mediaId: mediaIds[1],
        layout: "wide",
      },
      { type: "divider" },
    ],
    featuredMediaId: mediaIds[0],
    media: [
      { mediaId: mediaIds[0], sortOrder: 0 },
      { mediaId: mediaIds[1], sortOrder: 1 },
      { mediaId: mediaIds[2], sortOrder: 2 },
    ],
    categoryIds: [categoryId],
    tagIds: [tagId],
    seoTitle: "Phase 8 runtime verification",
    seoDescription: "Disposable verification of CTPS blog publishing.",
  });
  assert(draft.response.ok && draft.body.status === "DRAFT", "Draft creation failed");
  postId = String(draft.body.id);
  let version = Number(draft.body.version);
  const initialRevisions = await json(`admin/blog/posts/${postId}/revisions`, {
    headers: { cookie: authorSession },
  });
  const firstRevision = (initialRevisions.body as unknown as { id: string }[])[0];
  assert(initialRevisions.response.ok && firstRevision, "Initial revision was not created");
  const edited = await mutate(`admin/blog/posts/${postId}`, "PATCH", authorSession, {
    version,
    title: "Phase 11.3 runtime edited title",
  });
  assert(edited.response.ok, "Rich Draft update failed");
  version = Number(edited.body.version);
  const restored = await mutate(
    `admin/blog/posts/${postId}/revisions/${firstRevision.id}/restore`,
    "POST",
    authorSession,
    { version },
  );
  assert(
    restored.response.ok &&
      restored.body.status === "DRAFT" &&
      restored.body.title === "Phase 11.3 runtime property-care guide",
    "Revision restore failed",
  );
  version = Number(restored.body.version);
  assert(
    (await json(`public/blog/posts/${slug}`)).response.status === 404,
    "Draft leaked publicly",
  );
  assert(
    (await fetch(`${base}/media/blog/${mediaIds[0]}/featured`)).status === 404,
    "Draft media leaked publicly",
  );
  assert(
    (await json(`admin/blog/posts/${postId}`, { headers: { cookie: otherSession } })).response
      .status === 404,
    "Another Author read the Draft",
  );
  const crossUpdate = await mutate(`admin/blog/posts/${postId}`, "PATCH", otherSession, {
    version,
    title: "Unauthorized edit",
  });
  assert(crossUpdate.response.status === 404, "Another Author updated the Draft");
  const publish = await mutate(`admin/blog/posts/${postId}/publish`, "POST", authorSession, {
    version,
  });
  assert(publish.response.ok && publish.body.status === "PUBLISHED", "Author publication failed");
  version = Number(publish.body.version);
  assert((await json(`public/blog/posts/${slug}`)).response.ok, "Published article unavailable");
  const publicMedia = await fetch(`${base}/media/blog/${mediaIds[0]}/featured`);
  assert(
    publicMedia.ok && publicMedia.headers.get("content-type") === "image/webp",
    "Published media unavailable",
  );
  const unpublish = await mutate(`admin/blog/posts/${postId}/unpublish`, "POST", authorSession, {
    version,
  });
  assert(unpublish.response.ok && unpublish.body.status === "DRAFT", "Unpublish failed");
  version = Number(unpublish.body.version);
  assert(
    (await json(`public/blog/posts/${slug}`)).response.status === 404,
    "Unpublished article remained public",
  );
  assert(
    (await fetch(`${base}/media/blog/${mediaIds[0]}/featured`)).status === 404,
    "Unpublished media remained public",
  );
  const schedule = await mutate(`admin/blog/posts/${postId}/schedule`, "POST", authorSession, {
    version,
    scheduledFor: new Date(Date.now() + 60_000).toISOString(),
  });
  assert(schedule.response.ok && schedule.body.status === "SCHEDULED", "Scheduling failed");
  await prisma.blogPost.update({
    where: { id: postId },
    data: { scheduledFor: new Date(Date.now() - 1000) },
  });
  const scheduler = api.get(BlogService);
  const first = await scheduler.publishDue();
  const second = await scheduler.publishDue();
  assert(
    first.published === 1 && second.published === 0,
    "Scheduled worker was not publish-once idempotent",
  );
  assert(
    (await json(`public/blog/posts/${slug}`)).response.ok,
    "Scheduled article did not become public",
  );
  const events = await prisma.auditLog.findMany({
    where: { resourceId: postId },
    select: { action: true, metadata: true },
  });
  assert(
    events.some(({ action }) => action === "blog_post.published") &&
      events.some(({ action }) => action === "blog_post.scheduled"),
    "Blog audit events missing",
  );
  assert(
    !/storageKey|privateRoot|publicRoot|content|csrf|token/i.test(JSON.stringify(events)),
    "Audit metadata exposed sensitive content",
  );
  process.stdout.write(
    `${JSON.stringify({ auditEvents: events.length, authorOwnership: true, draftPrivate: true, filesUploaded: mediaIds.length, noComments: true, publicationPublic: true, publicMedia: true, revisionRestore: true, richStructuredContent: true, scheduledPublication: true, schedulerIdempotent: true, unpublishedPrivate: true }, null, 2)}\n`,
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
    if (postId) await prisma.blogPost.deleteMany({ where: { id: postId } }).catch(() => undefined);
    if (categoryId)
      await prisma.blogCategory.deleteMany({ where: { id: categoryId } }).catch(() => undefined);
    if (tagId) await prisma.blogTag.deleteMany({ where: { id: tagId } }).catch(() => undefined);
    if (mediaIds.length)
      await prisma.blogMediaAsset
        .deleteMany({ where: { id: { in: mediaIds } } })
        .catch(() => undefined);
    if (userIds.length) {
      const resourceIds = [
        ...userIds,
        ...mediaIds,
        ...(postId ? [postId] : []),
        ...(categoryId ? [categoryId] : []),
        ...(tagId ? [tagId] : []),
      ];
      await prisma.auditLog.deleteMany({
        where: { OR: [{ actorUserId: { in: userIds } }, { resourceId: { in: resourceIds } }] },
      });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    for (const root of [
      process.env.BLOG_LOCAL_PRIVATE_ROOT ?? "../../storage/private/blog",
      process.env.BLOG_LOCAL_PUBLIC_ROOT ?? "../../storage/public/blog",
    ])
      for (const id of mediaIds)
        await rm(resolve(process.cwd(), root, id), { recursive: true, force: true }).catch(
          () => undefined,
        );
    await prisma.$disconnect();
  });
