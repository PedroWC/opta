import { useEffect } from "react";

/** Define o título da aba (e o que o leitor de tela anuncia ao trocar de página). */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} — Opta`;
  }, [title]);
}
