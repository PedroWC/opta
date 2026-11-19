import type { SimulationResponse } from "../../api/types.ts";
import { formatBRL } from "../../lib/format.ts";
import { Badge } from "../../ui/index.ts";
import { FACTOR_LABELS, regimeStyle } from "./regimes.ts";
import styles from "./Result.module.css";

type Props = { recommendation: NonNullable<SimulationResponse["recomendacao"]> };

/** A resposta primeiro: qual regime, quanto economiza e por quê (RF-03, RN-08). */
export function RecommendationCard({ recommendation }: Props) {
  const winner = regimeStyle(recommendation.regime);
  const runnerUp = recommendation.segundo_colocado ? regimeStyle(recommendation.segundo_colocado).label : null;
  const factor = FACTOR_LABELS[recommendation.fator_decisivo.codigo];
  return (
    <section aria-labelledby="recomendacao" className={styles["recommendation"]}>
      <h2 id="recomendacao">Fique no {winner.label}</h2>
      <p>
        <Badge tone="highlight">Menor carga</Badge>
      </p>
      {runnerUp ? (
        <p className={styles["saving"]}>
          Economia acumulada 2026–2033: <strong>{formatBRL(recommendation.economia_acumulada)}</strong> em relação ao {runnerUp}.
        </p>
      ) : (
        <p>Só um regime pôde ser calculado para esta empresa.</p>
      )}
      {runnerUp ? <p>Por quê: é o regime de menor carga acumulada entre os comparados.</p> : null}
      {runnerUp && factor && recommendation.fator_decisivo.codigo !== "NENHUM" ? (
        <p>
          O que mais pesou: <strong>{factor}</strong>, com diferença de {formatBRL(recommendation.fator_decisivo.diferenca)} no período.
        </p>
      ) : null}
      <p className={styles["caveat"]}>Na sua simulação, com as premissas de referência; não é garantia nem consultoria tributária.</p>
    </section>
  );
}
