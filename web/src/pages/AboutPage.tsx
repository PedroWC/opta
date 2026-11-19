import { usePageTitle } from "../app/usePageTitle.ts";
import { Callout } from "../ui/index.ts";

/** Metodologia (/sobre): o que o Opta faz e não faz, fontes legais e limites do MVP (RF-11). */
export function AboutPage() {
  usePageTitle("Metodologia");
  return (
    <>
      <h1>Metodologia</h1>
      <Callout tone="warning" title="Simulador educacional">
        O Opta ajuda a entender como a Reforma Tributária do Consumo afeta a escolha de regime. Ele não substitui o seu
        contador, não é consultoria tributária e usa premissas de referência que podem mudar com a regulamentação.
      </Callout>

      <h2>O que o Opta faz</h2>
      <p>
        Compara três regimes, ano a ano, de 2026 a 2033: Simples Nacional, Simples híbrido (em que a{" "}
        <abbr title="Contribuição sobre Bens e Serviços">CBS</abbr> e o{" "}
        <abbr title="Imposto sobre Bens e Serviços">IBS</abbr> são recolhidos fora do{" "}
        <abbr title="Documento de Arrecadação do Simples Nacional">DAS</abbr>) e Lucro Presumido. Recomenda o regime de
        menor carga e explica o que mais pesou na diferença.
      </p>

      <h2>Limites desta versão</h2>
      <ul>
        <li>Atividades de serviços e comércio; sem substituição tributária, monofasia, Imposto Seletivo, indústria nem MEI.</li>
        <li>Simples Nacional pelos Anexos III e V, com Fator R. Acima de R$ 3,6 milhões, ISS e ICMS saem do DAS e não são calculados.</li>
        <li>Alíquotas de CBS e IBS são premissas de referência, configuráveis por vigência.</li>
        <li>Itens marcados com ⚠️ na documentação ainda precisam de conferência na fonte legal.</li>
      </ul>

      <h2>Fontes legais</h2>
      <ul>
        <li>Emenda Constitucional 132/2023 e Lei Complementar 214/2025 (IBS, CBS e Imposto Seletivo).</li>
        <li>Lei Complementar 123/2006 (Simples Nacional) e suas alterações.</li>
        <li>Lei 9.249/1995 e Lei 9.430/1996 (Lucro Presumido).</li>
        <li>Lei Complementar 116/2003 (ISS).</li>
      </ul>

      <h2>Como ler a memória de cálculo</h2>
      <p>
        Cada linha mostra a base de cálculo, a alíquota, o valor e a fonte legal. No Simples, o DAS é uma linha única e
        sua partilha (IRPJ, CSLL, CPP e demais) aparece como detalhe. Nos tributos sobre o consumo, o débito e o crédito
        são mostrados separadamente.
      </p>

      <h2>Privacidade</h2>
      <p>
        Os números que você digita não são guardados no servidor. Para compartilhar uma simulação, o endereço da página
        carrega os dados no fragmento (depois do <code>#</code>), que o navegador não envia ao servidor.
      </p>

      <h2>Código e decisões</h2>
      <p>
        O projeto é aberto: <a href="https://github.com/PedroWC/opta">repositório no GitHub</a>, com requisitos, decisões
        de arquitetura (ADRs) e o contrato da API.
      </p>
    </>
  );
}
