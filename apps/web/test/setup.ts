import { vi } from "vitest";

process.env.PUBLIC_INDEXING_ENABLED ??= "true";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw Object.assign(new Error("NEXT_NOT_FOUND"), { digest: "NEXT_HTTP_ERROR_FALLBACK;404" });
  },
  permanentRedirect: (url: string) => {
    throw Object.assign(new Error(`Permanent redirect to ${url}`), {
      digest: `NEXT_REDIRECT;replace;${url};308`,
    });
  },
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
