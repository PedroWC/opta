import { useState } from "react";
import { Badge, Button, Callout, CheckboxGroup, DefinitionList, Disclosure, MoneyField, PercentField, Select, Skeleton, Table, Tabs, TextField } from "./index.ts";

/** Vitrine de todos os componentes e estados; usada em testes de acessibilidade e, em desenvolvimento, em `#/ui`. */
export function UiShowcase() {
  const [money, setMoney] = useState("1800000.00");
  const [percent, setPercent] = useState("70");
  const [regimes, setRegimes] = useState<string[]>(["SIMPLES"]);
  return (
    <main>
      <h1>Componentes</h1>
      <section aria-labelledby="ui-buttons">
        <h2 id="ui-buttons">Botões</h2>
        <Button>Simular</Button> <Button variant="secondary">Preencher com um exemplo</Button>{" "}
        <Button variant="text">Limpar</Button> <Button loading>Calculando</Button>
      </section>
      <section aria-labelledby="ui-fields">
        <h2 id="ui-fields">Campos</h2>
        <TextField label="Nome da empresa" hint="Opcional; não é enviado ao servidor." />
        <TextField label="CNAE" error="Use o formato 0000-0/00." defaultValue="123" />
        <MoneyField label="Receita bruta anual" hint="Soma dos últimos 12 meses." value={money} onValueChange={setMoney} />
        <PercentField label="Vendas para empresas (B2B)" value={percent} onValueChange={setPercent} />
        <Select label="UF" placeholder="Escolha" options={[{ value: "SP", label: "São Paulo" }, { value: "MG", label: "Minas Gerais" }]} />
        <CheckboxGroup
          legend="Regimes"
          options={[{ value: "SIMPLES", label: "Simples Nacional" }, { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" }]}
          selected={regimes}
          onChange={setRegimes}
        />
      </section>
      <section aria-labelledby="ui-feedback">
        <h2 id="ui-feedback">Avisos</h2>
        <Callout tone="info" title="Premissas 2026.1">Alíquotas de referência.</Callout>
        <Callout tone="warning" title="Conferência pendente">Regra marcada com ⚠️ na documentação.</Callout>
        <Callout tone="error" title="Não foi possível simular">Tente novamente.</Callout>
        <Callout tone="success" title="Link copiado">Cole onde quiser.</Callout>
        <Skeleton />
        <Badge tone="highlight">Menor carga</Badge> <Badge>Premissas 2026.1</Badge>
      </section>
      <section aria-labelledby="ui-structure">
        <h2 id="ui-structure">Estrutura</h2>
        <Disclosure summary="Como calculamos">Texto explicativo.</Disclosure>
        <Tabs
          label="Regimes"
          tabs={[
            { id: "a", label: "Simples", panel: <p>Painel do Simples.</p> },
            { id: "b", label: "Híbrido", panel: <p>Painel do híbrido.</p> },
            { id: "c", label: "Presumido", panel: <p>Painel do presumido.</p> },
          ]}
        />
        <Table caption="Carga por ano">
          <thead>
            <tr><th scope="col">Ano</th><th scope="col">Simples</th></tr>
          </thead>
          <tbody>
            <tr><th scope="row">2026</th><td>24.240,00</td></tr>
          </tbody>
        </Table>
        <DefinitionList items={[{ term: "DAS", description: "24.240,00" }]} />
      </section>
    </main>
  );
}
