import { useEffect, useRef } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useSimulation } from "../api/hooks.ts";
import { usePageTitle } from "../app/usePageTitle.ts";
import { decodeFragment, encodeRequest } from "../features/share/inputUrlCodec.ts";
import { CopyLinkButton } from "../features/share/CopyLinkButton.tsx";
import { ChartSection } from "../features/result/ChartSection.tsx";
import { ComparisonTable } from "../features/result/ComparisonTable.tsx";
import { MemorySection } from "../features/result/MemorySection.tsx";
import { RecommendationCard } from "../features/result/RecommendationCard.tsx";
import { regimeStyle } from "../features/result/regimes.ts";
import { formatBRL } from "../lib/format.ts";
import { Button, Callout, Skeleton } from "../ui/index.ts";
import styles from "../features/result/Result.module.css";

/** Resultado da simulação (UC-01). A entrada vive no fragmento da URL (`#v1.…`), que o navegador não envia ao servidor. */
export function ResultPage() {
  usePageTitle("Resultado");
  const location = useLocation();
  const decoded = decodeFragment(location.hash);
  const request = decoded.status === "valid" ? decoded.request : null;
  const simulation = useSimulation(request);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (simulation.isSuccess) heading.current?.focus();
  }, [simulation.isSuccess]);

  if (decoded.status === "invalid") {
    // Link com dados que não passam na validação: volta ao formulário com o que for válido preenchido.
    return <Navigate to={{ pathname: "/", hash: location.hash }} state={{ invalidLink: true }} replace />;
  }

  if (!request) {
    return (
      <>
        <h1>Resultado da simulação</h1>
        <Callout tone="info" title="Nenhuma simulação aberta">
          Preencha o formulário para ver o resultado. <Link to="/">Ir para o simulador</Link>.
        </Callout>
      </>
    );
  }

  const data = simulation.data;
  const winner = data?.recomendacao ? regimeStyle(data.recomendacao.regime).label : null;

  return (
    <>
      <h1 ref={heading} tabIndex={-1}>Resultado da simulação</h1>
      <p className={styles["summary"]}>
        <span>
          CNAE {request.cnae} · {request.uf} · Receita {formatBRL(request.receita_bruta_anual)} · {request.perfil_clientes.b2b_pct}% B2B
        </span>
        <Link to={{ pathname: "/", hash: `#${encodeRequest(request)}` }}>Ajustar dados</Link>
        <CopyLinkButton />
      </p>

      {simulation.isPending ? <Skeleton label="Calculando 8 anos e 3 regimes…" lines={6} /> : null}

      {simulation.isError ? (
        <Callout tone="error" title="Não foi possível calcular agora">
          Seus dados foram mantidos. <Button variant="text" onClick={() => void simulation.refetch()}>Tentar de novo</Button>
        </Callout>
      ) : null}

      {data ? (
        <>
          <p role="status" className="visually-hidden">
            {winner ? `Resultado pronto. Melhor regime: ${winner}.` : "Resultado pronto. Nenhum regime pôde ser calculado."}
          </p>
          {data.regimes_indisponiveis.map((item) => (
            <Callout key={item.regime} tone="warning" title={`${regimeStyle(item.regime).label} não se aplica`}>
              {item.detalhe}
            </Callout>
          ))}
          {data.recomendacao ? <RecommendationCard recommendation={data.recomendacao} /> : null}
          <ChartSection simulation={data} />
          <h2>Comparativo ano a ano</h2>
          <ComparisonTable simulation={data} />
          <MemorySection years={data.anos} />
          {data.avisos.length > 0 ? (
            <section aria-labelledby="avisos">
              <h2 id="avisos">Avisos</h2>
              <ul>
                {data.avisos.map((notice) => (
                  <li key={notice}>{notice}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
