import { useEffect, useState } from "react";
import type { AnoResultado, LinhaTributo } from "./memoryTypes.ts";
import { formatBRL, formatRate } from "../../lib/format.ts";
import { useMediaQuery } from "../../lib/useMediaQuery.ts";
import { DefinitionList, Disclosure, Table, Tabs } from "../../ui/index.ts";
import { regimeStyle } from "./regimes.ts";
import { taxName } from "./taxNames.ts";
import styles from "./Result.module.css";

type RegimeYear = AnoResultado["regimes"][number];

function Detail({ line }: { line: LinhaTributo }) {
  return (
    <tr>
      <th scope="row" className={styles["detail"]}>
        <span aria-hidden="true">↳ </span>
        {taxName(line.codigo)}
        <span className="visually-hidden"> (detalhe, não soma ao total)</span>
      </th>
      <td>{formatBRL(line.base)}</td>
      <td>{formatRate(line.aliquota)}</td>
      <td>{formatBRL(line.valor)}</td>
      <td>{line.fonte}</td>
    </tr>
  );
}

function LinesTable({ year, regime }: { year: number; regime: RegimeYear }) {
  return (
    <Table caption={`Memória de cálculo de ${year}: ${regimeStyle(regime.regime).label}`}>
      <thead>
        <tr>
          <th scope="col">Tributo</th>
          <th scope="col">Base</th>
          <th scope="col">Alíquota</th>
          <th scope="col">Valor</th>
          <th scope="col">Fonte legal</th>
        </tr>
      </thead>
      <tbody>
        {regime.tributos.flatMap((line) => [
          <tr key={line.codigo}>
            <th scope="row">{taxName(line.codigo)}</th>
            <td>{formatBRL(line.base)}</td>
            <td>{formatRate(line.aliquota)}</td>
            <td>{formatBRL(line.valor)}</td>
            <td>{line.fonte}</td>
          </tr>,
          ...(line.detalhes ?? []).map((detail) => <Detail key={`${line.codigo}-${detail.codigo}`} line={detail} />),
        ])}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">Carga total do ano</th>
          <td />
          <td>{formatRate(regime.aliquota_efetiva)} da receita</td>
          <td>{formatBRL(regime.carga_total)}</td>
          <td />
        </tr>
      </tfoot>
    </Table>
  );
}

function LinesList({ regime }: { regime: RegimeYear }) {
  return (
    <>
      {regime.tributos.map((line) => (
        <section key={line.codigo} className={styles["card"]} aria-label={taxName(line.codigo)}>
          <h3>{taxName(line.codigo)}</h3>
          <DefinitionList
            items={[
              { term: "Base", description: formatBRL(line.base) },
              { term: "Alíquota", description: formatRate(line.aliquota) },
              { term: "Valor", description: formatBRL(line.valor) },
              { term: "Fonte legal", description: line.fonte },
              ...(line.detalhes ?? []).map((detail) => ({
                term: `Detalhe: ${taxName(detail.codigo)}`,
                description: `${formatBRL(detail.valor)} (${formatRate(detail.aliquota)} da base; não soma ao total)`,
              })),
            ]}
          />
        </section>
      ))}
      <p>
        <strong>Carga total do ano: {formatBRL(regime.carga_total)}</strong> ({formatRate(regime.aliquota_efetiva)} da receita)
      </p>
    </>
  );
}

function YearMemory({ year, printing }: { year: AnoResultado; printing: boolean }) {
  const [open, setOpen] = useState(false);
  const narrow = useMediaQuery("(max-width: 40em)");
  return (
    <Disclosure summary={`${year.ano}`} onToggle={setOpen} open={printing || undefined}>
      {open || printing ? (
        <Tabs
          label={`Regimes de ${year.ano}`}
          initialId={year.melhor_regime}
          tabs={year.regimes.map((regime) => {
            const style = regimeStyle(regime.regime);
            return {
              id: regime.regime,
              label: `${style.marker} ${style.label}${regime.regime === year.melhor_regime ? " (menor carga)" : ""}`,
              panel: narrow ? <LinesList regime={regime} /> : <LinesTable year={year.ano} regime={regime} />,
            };
          })}
        />
      ) : null}
    </Disclosure>
  );
}

/** Memória de cálculo auditável (RF-06): um acordeão por ano, abas por regime e a fonte legal em cada linha. */
export function MemorySection({ years }: { years: readonly AnoResultado[] }) {
  // Ao imprimir, todos os anos aparecem expandidos (a folha impressa não tem como abrir um item).
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = (): void => setPrinting(true);
    const after = (): void => setPrinting(false);
    window.addEventListener("beforeprint", before);
    window.addEventListener("afterprint", after);
    return () => {
      window.removeEventListener("beforeprint", before);
      window.removeEventListener("afterprint", after);
    };
  }, []);
  return (
    <section aria-labelledby="memoria">
      <h2 id="memoria" tabIndex={-1}>Memória de cálculo</h2>
      <p>Abra um ano para ver, regime a regime, a base, a alíquota, o valor e a fonte legal de cada tributo.</p>
      {years.map((year) => (
        <YearMemory key={year.ano} year={year} printing={printing} />
      ))}
    </section>
  );
}
