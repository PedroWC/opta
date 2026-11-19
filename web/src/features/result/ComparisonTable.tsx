import type { Regime, SimulationResponse } from "../../api/types.ts";
import { formatBRL, formatRate, sumMoney } from "../../lib/format.ts";
import { useMediaQuery } from "../../lib/useMediaQuery.ts";
import { Table } from "../../ui/index.ts";
import { RegimeBadge } from "./RegimeBadge.tsx";
import { regimeStyle } from "./regimes.ts";
import styles from "./Result.module.css";

type Props = { simulation: SimulationResponse };

function BestMark({ regime }: { regime: Regime }) {
  return (
    <span className={styles["best"]}>
      <span aria-hidden="true">✓ </span>
      {regimeStyle(regime).label}
    </span>
  );
}

/** Comparativo ano a ano (RF-02) com o total acumulado (RN-08). Em tela estreita, um cartão por ano. */
export function ComparisonTable({ simulation }: Props) {
  const narrow = useMediaQuery("(max-width: 40em)");
  const regimes = simulation.anos[0]?.regimes.map((item) => item.regime) ?? [];
  const totals = regimes.map((regime) => ({
    regime,
    total: sumMoney(simulation.anos.map((year) => year.regimes.find((item) => item.regime === regime)?.carga_total ?? "0.00")),
  }));
  const overallBest = simulation.recomendacao?.regime;

  if (narrow) {
    return (
      <div>
        {simulation.anos.map((year) => (
          <section key={year.ano} className={styles["card"]} aria-labelledby={`ano-${year.ano}`}>
            <h3 id={`ano-${year.ano}`}>{year.ano}</h3>
            <dl>
              {year.regimes.map((item) => (
                <div key={item.regime}>
                  <dt>
                    <RegimeBadge regime={item.regime} />
                    {item.regime === year.melhor_regime ? <span> (menor carga)</span> : null}
                  </dt>
                  <dd>
                    {formatBRL(item.carga_total)}
                    <span className={styles["rate"]}>{formatRate(item.aliquota_efetiva)} da receita</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <section className={styles["card"]} aria-labelledby="total-acumulado">
          <h3 id="total-acumulado">Total 2026–2033</h3>
          <dl>
            {totals.map(({ regime, total }) => (
              <div key={regime}>
                <dt>
                  <RegimeBadge regime={regime} />
                  {regime === overallBest ? <span> (menor carga)</span> : null}
                </dt>
                <dd>{formatBRL(total)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    );
  }

  return (
    <Table caption="Carga tributária por ano e regime">
      <thead>
        <tr>
          <th scope="col">Ano</th>
          {regimes.map((regime) => (
            <th scope="col" key={regime}>
              <RegimeBadge regime={regime} />
            </th>
          ))}
          <th scope="col">Menor carga</th>
        </tr>
      </thead>
      <tbody>
        {simulation.anos.map((year) => (
          <tr key={year.ano}>
            <th scope="row">{year.ano}</th>
            {year.regimes.map((item) => (
              <td key={item.regime}>
                {formatBRL(item.carga_total)}
                <span className={styles["rate"]}>{formatRate(item.aliquota_efetiva)}</span>
              </td>
            ))}
            <td>
              <BestMark regime={year.melhor_regime} />
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Total 2026–2033</th>
          {totals.map(({ regime, total }) => (
            <td key={regime}>{formatBRL(total)}</td>
          ))}
          <td>{overallBest ? <BestMark regime={overallBest} /> : "—"}</td>
        </tr>
      </tfoot>
    </Table>
  );
}
