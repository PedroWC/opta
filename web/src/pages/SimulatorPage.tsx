import { useLocation, useNavigate } from "react-router-dom";
import type { SimulationRequest } from "../api/types.ts";
import { usePageTitle } from "../app/usePageTitle.ts";
import { fromRequest } from "../features/simulator/schema.ts";
import { SimulatorForm } from "../features/simulator/SimulatorForm.tsx";

/** Tela inicial: o formulário. O estado vai ao resultado por `location.state`; a issue #26 troca por fragmento na URL. */
export function SimulatorPage() {
  usePageTitle("Simulador");
  const navigate = useNavigate();
  const previous = (useLocation().state as { request?: SimulationRequest } | null)?.request;
  return (
    <>
      <h1>Qual regime compensa na Reforma Tributária?</h1>
      <p>Compare Simples Nacional, Simples híbrido e Lucro Presumido, de 2026 a 2033.</p>
      <SimulatorForm
        {...(previous ? { initialValues: fromRequest(previous) } : {})}
        onSubmit={(request) => navigate("/resultado", { state: { request } })}
      />
    </>
  );
}
