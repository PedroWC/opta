import { usePageTitle } from "../app/usePageTitle.ts";

/** Formulário do simulador: o conteúdo real entra na issue #21. */
export function SimulatorPage() {
  usePageTitle("Simulador");
  return (
    <>
      <h1>Simulador de regimes</h1>
      <p>Compare Simples Nacional, Simples híbrido e Lucro Presumido, ano a ano, de 2026 a 2033.</p>
    </>
  );
}
