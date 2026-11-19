import { lazy, Suspense, useState } from "react";
import type { SimulationResponse } from "../../api/types.ts";
import { Skeleton } from "../../ui/index.ts";
import styles from "./Result.module.css";

// O Recharts só é baixado quando o resultado aparece (RNF-11: JS inicial pequeno).
const CostChart = lazy(() => import("./CostChart.tsx"));

type Props = { simulation: SimulationResponse };

/** "Carga por ano": gráfico ou só a tabela (que fica sempre disponível logo abaixo). */
export function ChartSection({ simulation }: Props) {
  const [view, setView] = useState<"chart" | "table">("chart");
  return (
    <section aria-labelledby="carga-por-ano">
      <h2 id="carga-por-ano">Carga tributária por ano</h2>
      <fieldset className={styles["toggle"]}>
        <legend>Ver como</legend>
        <label>
          <input type="radio" name="visualizacao" checked={view === "chart"} onChange={() => setView("chart")} />
          Gráfico
        </label>
        <label>
          <input type="radio" name="visualizacao" checked={view === "table"} onChange={() => setView("table")} />
          Só a tabela
        </label>
      </fieldset>
      {view === "chart" ? (
        <Suspense fallback={<Skeleton label="Carregando o gráfico…" lines={4} />}>
          <CostChart simulation={simulation} />
        </Suspense>
      ) : (
        <p>A tabela abaixo traz os mesmos valores do gráfico.</p>
      )}
    </section>
  );
}
