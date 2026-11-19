import { Link } from "react-router-dom";
import { useAssumptions } from "../api/hooks.ts";
import { usePageTitle } from "../app/usePageTitle.ts";
import { ActivityLookup } from "../features/assumptions/ActivityLookup.tsx";
import { AssumptionsTable } from "../features/assumptions/AssumptionsTable.tsx";
import { Badge, Button, Callout, Skeleton } from "../ui/index.ts";

/** Premissas de cálculo (RF-04, UC-02) e consulta de atividade (RF-05, UC-03). */
export function AssumptionsPage() {
  usePageTitle("Premissas");
  const assumptions = useAssumptions();
  return (
    <>
      <h1>Premissas de cálculo</h1>
      {assumptions.data ? (
        <p>
          <Badge>Premissas v{assumptions.data.premissas_versao}</Badge>
        </p>
      ) : null}
      <p>
        As alíquotas finais ainda dependem de regulamentação (EC 132/2023 e LC 214/2025). Por isso são premissas de referência,
        configuráveis por vigência. Veja as <Link to="/sobre">fontes e os limites desta versão</Link>.
      </p>

      <h2>Transição por ano</h2>
      {assumptions.isPending ? <Skeleton label="Carregando as premissas…" lines={5} /> : null}
      {assumptions.isError ? (
        <Callout tone="error" title="Não foi possível carregar as premissas">
          <Button variant="text" onClick={() => void assumptions.refetch()}>Tentar de novo</Button>
        </Callout>
      ) : null}
      {assumptions.data ? <AssumptionsTable years={assumptions.data.anos} /> : null}

      <h2>Consultar atividade (CNAE)</h2>
      <ActivityLookup />
    </>
  );
}
