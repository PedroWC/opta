import { useSyncExternalStore } from "react";

/** Acompanha uma media query (ex.: tela estreita). Sem `matchMedia` (testes, SSR), considera que não casa. */
export function useMediaQuery(query: string): boolean {
  const subscribe = (notify: () => void): (() => void) => {
    if (typeof window.matchMedia !== "function") return () => undefined;
    const list = window.matchMedia(query);
    list.addEventListener("change", notify);
    return () => list.removeEventListener("change", notify);
  };
  const getSnapshot = (): boolean => (typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
