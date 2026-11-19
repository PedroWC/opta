import { usePageTitle } from "../app/usePageTitle.ts";

/** Premissas e consulta de CNAE: o conteúdo real entra na issue #27. */
export function AssumptionsPage() {
  usePageTitle("Premissas");
  return <h1>Premissas de alíquotas</h1>;
}
