import { createHash, randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { prisma } from "@ctps/database";

import { createApiApplication } from "../api-application";

const base = `http://127.0.0.1:${process.env.API_PORT ?? "4000"}`;
const origin = process.env.WEB_URL ?? "http://localhost:3000";
let api: INestApplication | undefined;
let quoteId: string | undefined;
let draftTokenHash: string | undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function json(path: string, init: RequestInit = {}) {
  const response = await fetch(`${base}/${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      origin,
      "user-agent": "ctps-runtime-verifier",
      ...init.headers,
    },
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { response, body };
}

async function main() {
  const existingQuotes = await prisma.quoteRequest.count();
  const invalidServiceAreaRows = await prisma.quoteRequest.count({
    where: {
      OR: [
        { province: { not: "British Columbia" } },
        {
          serviceAreaKey: {
            notIn: ["vancouver", "richmond", "burnaby", "surrey", "coquitlam", "north-vancouver"],
          },
        },
      ],
    },
  });
  assert(invalidServiceAreaRows === 0, "An invalid stored province or service area was found");
  const created = await createApiApplication();
  api = created.app;
  await api.listen(created.environment.API_PORT, "127.0.0.1");

  const draft = await json("public/quote-requests/drafts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ honeypot: "" }),
  });
  assert(draft.response.ok && typeof draft.body.draftToken === "string", "Draft creation failed");
  const draftToken = draft.body.draftToken;
  draftTokenHash = createHash("sha256").update(draftToken).digest("hex");
  const idempotencyKey = randomUUID();
  const body = {
    draftToken,
    idempotencyKey,
    honeypot: "",
    propertyType: "RESIDENTIAL",
    services: ["window-cleaning"],
    serviceAnswers: { "window-cleaning": { storeys: 2, interior: true } },
    propertyDetails: {},
    address: {
      line1: "100 Runtime Verification Street",
      city: "Vancouver",
      province: "British Columbia",
      postalCode: "V5K 0A1",
      serviceAreaKey: "vancouver",
    },
    preferredDates: [],
    contact: {
      fullName: "Runtime Verification",
      email: "phase6-runtime@invalid.example",
      phone: "+1 604 555 0100",
      preferredMethod: "EMAIL",
    },
    consent: true,
  };

  const minimumSeconds = Number(process.env.QUOTE_MIN_COMPLETION_SECONDS ?? "8");
  await new Promise((resolve) => setTimeout(resolve, minimumSeconds * 1000 + 250));
  const submitted = await json("public/quote-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  assert(submitted.response.ok, "Quote submission failed");
  const reference = submitted.body.reference;
  assert(
    typeof reference === "string" &&
      /^CTPS-\d{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(reference),
    "The runtime reference format is invalid",
  );

  const replay = await json("public/quote-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  assert(
    replay.response.ok &&
      replay.body.reference === reference &&
      replay.body.alreadySubmitted === true,
    "Idempotent replay did not return the original reference",
  );
  const quote = await prisma.quoteRequest.findUnique({ where: { reference } });
  assert(quote, "The submitted quote was not persisted");
  quoteId = quote.id;
  assert(
    (await prisma.quoteRequest.count({ where: { reference } })) === 1,
    "The unique reference was persisted more than once",
  );
  assert(
    (await prisma.quoteRequest.count()) === existingQuotes + 1,
    "Replay created a second quote",
  );

  process.stdout.write(
    `${JSON.stringify(
      {
        reference: `${reference.slice(0, 10)}********`,
        format: "CTPS-YYYY-XXXXXXXX",
        idempotentReplay: true,
        persistedOnce: true,
        province: quote.province,
        serviceAreaKey: quote.serviceAreaKey,
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
    if (quoteId) {
      await prisma.auditLog.deleteMany({ where: { resourceId: quoteId } });
      await prisma.quoteRequest.deleteMany({ where: { id: quoteId } });
    }
    if (draftTokenHash)
      await prisma.quoteRequestDraft.deleteMany({ where: { tokenHash: draftTokenHash } });
    const retainedRuntimeQuotes = await prisma.quoteRequest.count({
      where: { customerEmail: "phase6-runtime@invalid.example" },
    });
    if (retainedRuntimeQuotes > 0) {
      process.stderr.write("Runtime verification retained test customer data\n");
      process.exitCode = 1;
    }
    await prisma.$disconnect();
  });
