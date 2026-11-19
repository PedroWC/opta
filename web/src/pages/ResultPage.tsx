import { usePageTitle } from "../app/usePageTitle.ts";

/** Resultado da simulação: o conteúdo real entra nas issues #23 a #26. */
export function ResultPage() {
  usePageTitle("Resultado");
  return <h1>Resultado da simulação</h1>;
}
