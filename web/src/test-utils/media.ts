import { afterEach, vi } from "vitest";

/** Simula `matchMedia` (o jsdom não tem): `narrow` faz as consultas de largura máxima casarem. */
export function mockScreen({ narrow }: { narrow: boolean }): void {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: narrow && query.includes("max-width"),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
});
