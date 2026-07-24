import { vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
