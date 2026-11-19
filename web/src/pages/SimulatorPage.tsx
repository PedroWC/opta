import { useLocation, useNavigate } from "react-router-dom";
import { usePageTitle } from "../app/usePageTitle.ts";
import { decodeFragment, encodeRequest, valuesOf } from "../features/share/inputUrlCodec.ts";
import { SimulatorForm } from "../features/simulator/SimulatorForm.tsx";
import { Callout } from "../ui/index.ts";

/** Tela inicial: o formulário, que também reabre uma simulação a partir do fragmento da URL ("Ajustar dados" e links). */
export function SimulatorPage() {
  usePageTitle("Simulador");
  const navigate = useNavigate();
  const location = useLocation();
  const decoded = decodeFragment(location.hash);
  const initialValues = valuesOf(decoded);
  const invalidLink = decoded.status === "invalid";
  return (
    <>
      <h1>Qual regime compensa na Reforma Tributária?</h1>
      <p>Compare Simples Nacional, Simples híbrido e Lucro Presumido, de 2026 a 2033.</p>
      {invalidLink ? (
        <Callout tone="warning" title="Alguns dados do link não puderam ser usados">
          Preenchemos o que estava correto. Confira os campos e simule de novo.
        </Callout>
      ) : null}
      <SimulatorForm
        key={location.hash}
        initialValues={initialValues}
        onSubmit={(request) => navigate({ pathname: "/resultado", hash: `#${encodeRequest(request)}` })}
      />
    </>
  );
}
