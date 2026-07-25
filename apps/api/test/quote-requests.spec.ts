import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from "@nestjs/common";
import { QUOTE_SERVICE_AREA_DEFINITIONS, quoteSubmissionSchema } from "@ctps/validation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { QuoteEmailService } from "../src/quote-requests/quote-email.service";
import { QuoteMediaService } from "../src/quote-requests/quote-media.service";
import {
  QUOTE_REFERENCE_ALPHABET,
  QUOTE_REFERENCE_SUFFIX_LENGTH,
  QuoteReferenceService,
} from "../src/quote-requests/quote-reference.service";
import { QuoteRequestsService } from "../src/quote-requests/quote-requests.service";
import { QuoteSecurityService } from "../src/quote-requests/quote-security.service";

const validSubmission = {
  draftToken: "a".repeat(43),
  idempotencyKey: "00000000-0000-4000-8000-000000000010",
  honeypot: "",
  propertyType: "RESIDENTIAL",
  services: ["window-cleaning"],
  serviceAnswers: { "window-cleaning": { storeys: 2, interior: true } },
  propertyDetails: {},
  address: {
    line1: "100 Main Street",
    city: "Vancouver",
    province: "British Columbia",
    postalCode: "V5K 0A1",
    serviceAreaKey: "vancouver",
  },
  preferredDates: [],
  contact: {
    fullName: "Alex Customer",
    email: "alex@example.com",
    phone: "+1 604 555 0100",
    preferredMethod: "EMAIL",
  },
  consent: true,
} as const;

describe("quote submission validation", () => {
  it("accepts approved services, typed answers, area, contact, and consent", () => {
    expect(quoteSubmissionSchema.parse(validSubmission).contact.email).toBe("alex@example.com");
  });
  it("uses only the approved British Columbia service areas", () => {
    expect(QUOTE_SERVICE_AREA_DEFINITIONS).toEqual([
      { key: "vancouver", label: "Vancouver" },
      { key: "richmond", label: "Richmond" },
      { key: "burnaby", label: "Burnaby" },
      { key: "surrey", label: "Surrey" },
      { key: "coquitlam", label: "Coquitlam" },
      { key: "north-vancouver", label: "North Vancouver" },
    ]);
    expect(
      quoteSubmissionSchema.safeParse({
        ...validSubmission,
        address: { ...validSubmission.address, province: "Ontario" },
      }).success,
    ).toBe(false);
  });
  it("rejects missing typed answers, unsupported areas, honeypots, and absent consent", () => {
    const missingAnswer = structuredClone(validSubmission) as Record<string, unknown>;
    missingAnswer.serviceAnswers = { "window-cleaning": { storeys: 2 } };
    expect(quoteSubmissionSchema.safeParse(missingAnswer).success).toBe(false);
    expect(
      quoteSubmissionSchema.safeParse({
        ...validSubmission,
        honeypot: "spam",
        consent: false,
        address: { ...validSubmission.address, serviceAreaKey: "victoria" },
      }).success,
    ).toBe(false);
  });
  it("does not allow the client to choose a reference", () => {
    expect(
      quoteSubmissionSchema.safeParse({ ...validSubmission, reference: "CTPS-2026-CLIENT99" })
        .success,
    ).toBe(false);
  });
});

describe("public quote references", () => {
  it("uses the expected normalized format, suffix length, and human-readable alphabet", () => {
    const reference = new QuoteReferenceService().generate(new Date("2026-07-25T00:00:00Z"));
    const suffix = reference.split("-")[2]!;
    expect(reference).toMatch(/^CTPS-2026-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/);
    expect(suffix).toHaveLength(QUOTE_REFERENCE_SUFFIX_LENGTH);
    expect([...suffix].every((character) => QUOTE_REFERENCE_ALPHABET.includes(character))).toBe(
      true,
    );
    expect(reference).toBe(reference.toUpperCase());
  });

  it("generates different non-sequential references", () => {
    const service = new QuoteReferenceService();
    const generated = new Set(
      Array.from({ length: 32 }, () => service.generate(new Date("2026-07-25T00:00:00Z"))),
    );
    expect(generated.size).toBe(32);
    expect([...generated].join(" ")).not.toMatch(/CTPS-2026-00000\d/);
  });

  it("keeps database uniqueness and uppercase normalization constraints without a counter", () => {
    const schema = readFileSync(
      resolve(process.cwd(), "../../packages/database/prisma/schema.prisma"),
      "utf8",
    );
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "../../packages/database/prisma/migrations/20260725040000_secure_quote_references/migration.sql",
      ),
      "utf8",
    );
    expect(schema).toMatch(/reference\s+String\s+@unique/);
    expect(schema).not.toContain("model QuoteReferenceCounter");
    expect(migration).toContain('CHECK ("reference" = UPPER("reference"))');
    expect(migration).toContain('DROP TABLE "QuoteReferenceCounter"');
  });
});

function request(origin = "http://localhost:3000") {
  return {
    ip: "127.0.0.1",
    get: (name: string) =>
      name === "origin" ? origin : name === "user-agent" ? "test-browser" : undefined,
  };
}

describe("guest request security", () => {
  it("uses opaque 256-bit tokens and rejects an untrusted origin", () => {
    const service = new QuoteSecurityService(
      {} as never,
      {
        value: { WEB_URL: "http://localhost:3000" },
      } as never,
    );
    const token = service.token();
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(service.hash(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(() =>
      service.assertTrustedBrowser(request("https://attacker.example") as never),
    ).toThrow(ForbiddenException);
  });
  it("durably blocks a source that exceeds the fixed-window limit", async () => {
    const update = vi.fn();
    const service = new QuoteSecurityService(
      {
        client: {
          publicRequestThrottle: {
            upsert: vi.fn().mockResolvedValue({
              attempts: 2,
              windowStartedAt: new Date(),
              blockedUntil: null,
            }),
            update,
          },
        },
      } as never,
      {
        value: {
          WEB_URL: "http://localhost:3000",
          QUOTE_RATE_LIMIT_WINDOW_SECONDS: 900,
          QUOTE_RATE_LIMIT_MAX_ATTEMPTS: 2,
        },
      } as never,
    );
    await expect(service.throttle(request() as never, "submit")).rejects.toBeInstanceOf(
      HttpException,
    );
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ blockedUntil: expect.any(Date) }),
      }),
    );
  });
});

describe("protected quote workflow", () => {
  it("returns an idempotent replay without allocating another reference", async () => {
    const service = new QuoteRequestsService(
      {
        client: {
          quoteRequest: {
            findUnique: vi.fn().mockResolvedValue({ reference: "CTPS-2026-7K3M9QXZ" }),
          },
        },
      } as never,
      {} as never,
      {
        assertTrustedBrowser: vi.fn(),
        throttle: vi.fn(),
        hash: vi.fn().mockReturnValue("hash"),
      } as never,
      {} as never,
      {} as never,
      {} as never,
      { generate: vi.fn() } as never,
    );
    await expect(service.submit(validSubmission as never, request() as never)).resolves.toEqual({
      reference: "CTPS-2026-7K3M9QXZ",
      alreadySubmitted: true,
    });
  });
  it("retries a database reference collision with a fresh cryptographic value", async () => {
    const findUnique = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    const transaction = {
      quoteRequest: {
        create: vi.fn(({ data }: { data: { reference: string } }) =>
          Promise.resolve({
            id: "quote",
            reference: data.reference,
            customerEmail: "alex@example.com",
            customerName: "Alex Customer",
          }),
        ),
      },
      quoteRequestUpload: { updateMany: vi.fn() },
      quoteRequestDraft: { update: vi.fn() },
      emailOutbox: { createMany: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const collision = Object.assign(new Error("unique"), {
      code: "P2002",
      meta: { target: ["reference"] },
    });
    const database = {
      client: {
        quoteRequest: { findUnique },
        quoteRequestDraft: {
          findUnique: vi.fn().mockResolvedValue({
            id: "draft",
            expiresAt: new Date(Date.now() + 60_000),
            submittedAt: null,
            startedAt: new Date(Date.now() - 60_000),
            sourceHash: "hash",
            uploads: [],
          }),
        },
        $transaction: vi
          .fn()
          .mockRejectedValueOnce(collision)
          .mockImplementationOnce((callback: (client: typeof transaction) => unknown) =>
            callback(transaction),
          ),
      },
    };
    const references = {
      generate: vi
        .fn()
        .mockReturnValueOnce("CTPS-2026-7K3M9QXZ")
        .mockReturnValueOnce("CTPS-2026-H4W8R2TY"),
    };
    const service = new QuoteRequestsService(
      database as never,
      {
        value: {
          QUOTE_MIN_COMPLETION_SECONDS: 8,
          EMAIL_FROM: "quotes@example.invalid",
          QUOTE_STAFF_EMAIL: "quotes@example.invalid",
        },
      } as never,
      {
        assertTrustedBrowser: vi.fn(),
        throttle: vi.fn(),
        hash: vi.fn().mockReturnValue("hash"),
        source: vi.fn().mockReturnValue("hash"),
        token: vi.fn().mockReturnValue("confirmation-token"),
      } as never,
      { records: vi.fn().mockReturnValue([]), dispatchForRequest: vi.fn() } as never,
      {} as never,
      {} as never,
      references as never,
    );
    await expect(service.submit(validSubmission as never, request() as never)).resolves.toEqual({
      reference: "CTPS-2026-H4W8R2TY",
      confirmationToken: "confirmation-token",
      alreadySubmitted: false,
    });
    expect(references.generate).toHaveBeenCalledTimes(2);
  });
  it("looks up confirmation only by a hash of the high-entropy token", async () => {
    const findUnique = vi.fn().mockResolvedValue({
      reference: "CTPS-2026-H4W8R2TY",
      createdAt: new Date("2026-07-25T00:00:00Z"),
    });
    const service = new QuoteRequestsService(
      { client: { quoteRequest: { findUnique } } } as never,
      {} as never,
      { hash: vi.fn().mockReturnValue("token-hash") } as never,
      {} as never,
      {} as never,
      {} as never,
      { generate: vi.fn() } as never,
    );
    expect((await service.confirmation("raw-token")).reference).toBe("CTPS-2026-H4W8R2TY");
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { confirmationTokenHash: "token-hash" } }),
    );
  });
  it("rejects image content whose signature, MIME, and extension do not agree", async () => {
    const media = new QuoteMediaService(
      {
        client: {
          quoteRequestDraft: {
            findUnique: vi.fn().mockResolvedValue({
              id: "draft",
              expiresAt: new Date(Date.now() + 60000),
              submittedAt: null,
            }),
          },
          quoteRequestUpload: { findMany: vi.fn().mockResolvedValue([]) },
        },
      } as never,
      {
        value: {
          QUOTE_PRIVATE_MEDIA_ROOT: "../../storage/private/quote-requests",
          QUOTE_MAX_UPLOAD_FILES: 8,
          QUOTE_MAX_TOTAL_UPLOAD_BYTES: 33554432,
          QUOTE_MAX_FILE_BYTES: 8388608,
        },
      } as never,
      { hash: vi.fn().mockReturnValue("hash") } as never,
      { record: vi.fn() } as never,
    );
    const file = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      size: 4,
      originalname: "property.jpg",
      mimetype: "image/png",
    };
    await expect(media.upload("token", [file] as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
  it("rejects an invalid status transition without writing history", async () => {
    const database = {
      client: {
        quoteRequest: { findUnique: vi.fn().mockResolvedValue({ id: "quote", status: "NEW" }) },
        $transaction: vi.fn(),
      },
    };
    const service = new QuoteRequestsService(
      database as never,
      {} as never,
      {} as never,
      {} as never,
      { record: vi.fn() } as never,
      {} as never,
      { generate: vi.fn() } as never,
    );
    await expect(service.status("quote", { status: "ACCEPTED" }, "actor")).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(database.client.$transaction).not.toHaveBeenCalled();
  });
  it("records a failed email attempt without throwing away the submitted request", async () => {
    const update = vi.fn();
    const service = new QuoteEmailService(
      {
        client: {
          emailOutbox: {
            findMany: vi
              .fn()
              .mockResolvedValue([
                { id: "email", payload: { to: "a@example.com" }, status: "PENDING" },
              ]),
            update,
          },
        },
      } as never,
      { value: { EMAIL_DELIVERY_MODE: "disabled" } } as never,
    );
    (service as unknown as { adapter: { send: () => Promise<void> } }).adapter = {
      send: vi.fn().mockRejectedValue(new Error("offline")),
    };
    await expect(service.dispatchForRequest("quote")).resolves.toBeUndefined();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "FAILED", attempts: { increment: 1 } }),
      }),
    );
  });
});
