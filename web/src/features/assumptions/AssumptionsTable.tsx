import type { AssumptionsResponse } from "../../api/types.ts";
import { formatRate } from "../../lib/format.ts";
import { useMediaQuery } from "../../lib/useMediaQuery.ts";
import { DefinitionList, Table } from "../../ui/index.ts";
import styles from "../result/Result.module.css";

type Year = AssumptionsResponse["anos"][number];

function consumptionTax(rate: string, testYear: boolean): string {
  return testYear ? `${formatRate(rate)} (teste, compensada)` : formatRate(rate);
}

function icmsIss(percentInForce: number): string {
  if (percentInForce === 0) return "extintos";
  return percentInForce === 100 ? "vigentes" : `${percentInForce}% vigentes`;
}

const pisCofins = (extinct: boolean): string => (extinct ? "extintos" : "vigentes");

/** Transição CBS/IBS por ano (RF-04, RN-02): colunas em texto, pois "extintos" e "vigentes" não são números. */
export function AssumptionsTable({ years }: { years: readonly Year[] }) {
  const narrow = useMediaQuery("(max-width: 40em)");
  if (narrow) {
    return (
      <div>
        {years.map((year) => (
          <section key={year.ano} className={styles["card"]} aria-labelledby={`premissa-${year.ano}`}>
            <h3 id={`premissa-${year.ano}`}>{year.ano}</h3>
            <DefinitionList
              items={[
                { term: "CBS", description: consumptionTax(year.cbs, year.ano_de_teste) },
                { term: "IBS", description: consumptionTax(year.ibs, year.ano_de_teste) },
                { term: "ICMS e ISS", description: icmsIss(year.icms_iss_vigente_pct) },
                { term: "PIS e Cofins", description: pisCofins(year.pis_cofins_extinto) },
              ]}
            />
          </section>
        ))}
      </div>
    );
  }
  return (
    <Table caption="Transição da CBS e do IBS por ano">
      <thead>
        <tr>
          <th scope="col">Ano</th>
          <th scope="col">CBS</th>
          <th scope="col">IBS</th>
          <th scope="col">ICMS e ISS</th>
          <th scope="col">PIS e Cofins</th>
        </tr>
      </thead>
      <tbody>
        {years.map((year) => (
          <tr key={year.ano}>
            <th scope="row">{year.ano}</th>
            <td>{consumptionTax(year.cbs, year.ano_de_teste)}</td>
            <td>{consumptionTax(year.ibs, year.ano_de_teste)}</td>
            <td>{icmsIss(year.icms_iss_vigente_pct)}</td>
            <td>{pisCofins(year.pis_cofins_extinto)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
