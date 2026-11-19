import type { Activity } from "../../api/types.ts";
import { Callout } from "../../ui/index.ts";

type Props = { activity: Activity };

const percent = (value: string): string => `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;

/** O que a API sabe sobre o CNAE escolhido: natureza, anexo do Simples, Fator R e presunção do Lucro Presumido. */
export function ActivityCard({ activity }: Props) {
  const commerce = activity.natureza === "COMERCIO";
  return (
    <section aria-label="Sobre a atividade escolhida" style={{ marginBottom: "var(--space-4)" }}>
      <p><strong>{activity.descricao}</strong></p>
      <ul>
        <li>{commerce ? "Comércio (ICMS)" : "Serviços (ISS)"}</li>
        {activity.anexo_simples ? (
          <li>
            {activity.usa_fator_r
              ? "Simples Nacional: Anexo V; passa ao Anexo III se o Fator R for de 28% ou mais."
              : `Simples Nacional: Anexo ${activity.anexo_simples}.`}
          </li>
        ) : null}
        <li>
          Lucro Presumido: presunção de {percent(activity.presuncao_irpj)} para o IRPJ e {percent(activity.presuncao_csll)} para a CSLL.
        </li>
      </ul>
      {commerce ? (
        <Callout tone="warning" title="Simples Nacional indisponível para comércio">
          Nesta versão o Simples Nacional só calcula serviços (Anexos III e V). Para esta atividade a simulação mostra o Lucro
          Presumido e avisa quais regimes não se aplicam.
        </Callout>
      ) : null}
    </section>
  );
}
