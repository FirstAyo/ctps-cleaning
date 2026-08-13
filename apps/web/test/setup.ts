import { vi } from "vitest";

process.env.PUBLIC_INDEXING_ENABLED ??= "true";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
