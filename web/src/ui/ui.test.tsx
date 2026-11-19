import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { formatMoneyText, parseMoneyInput } from "../lib/money.ts";
import { expectNoA11yViolations } from "../test-utils/axe.ts";
import { Badge, Button, Callout, CheckboxGroup, Disclosure, MoneyField, PercentField, Select, Skeleton, SkipLink, Table, Tabs, TextField } from "./index.ts";
import { UiShowcase } from "./UiShowcase.tsx";

describe("RNF-09: a vitrine inteira não tem violações do axe", () => {
  test("RNF-09: todos os componentes e estados juntos", async () => {
    const { container } = render(<UiShowcase />);
    await expectNoA11yViolations(container);
  });
});

describe("Button", () => {
  test("RNF-09: tem type=button por padrão e dispara o clique", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Simular</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Simular" }));
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  test("RNF-09: carregando fica inerte, anunciado e continua focável (aria-disabled, não disabled)", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Calculando</Button>);
    const button = screen.getByRole("button", { name: /Calculando/ });
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Carregando");
  });
});

describe("TextField", () => {
  test("RNF-09: rótulo, dica e erro ficam ligados ao campo", () => {
    render(<TextField label="CNAE" hint="Ex.: 6201-5/01" error="Use o formato 0000-0/00." />);
    const input = screen.getByLabelText("CNAE");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(/Ex\.: 6201-5\/01/);
    expect(input).toHaveAccessibleDescription(/Erro: Use o formato 0000-0\/00\./);
  });

  test("RNF-09: sem erro o campo não é marcado como inválido", () => {
    render(<TextField label="Nome" />);
    expect(screen.getByLabelText("Nome")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Nome")).not.toHaveAttribute("aria-describedby");
  });
});

describe("MoneyField e o texto decimal (RNF-02)", () => {
  test("RNF-02: parseMoneyInput aceita pt-BR, ponto decimal e prefixo, e devolve texto com duas casas", () => {
    expect(parseMoneyInput("1.800.000,50")).toBe("1800000.50");
    expect(parseMoneyInput("R$ 1.500")).toBe("1500.00");
    expect(parseMoneyInput("1,5")).toBe("1.50");
    expect(parseMoneyInput("1800000.5")).toBe("1800000.50");
    expect(parseMoneyInput("300000")).toBe("300000.00");
    expect(parseMoneyInput("12.345,6")).toBe("12345.60");
  });

  test("RN-09: valores ilegíveis ou vazios viram null", () => {
    for (const bad of ["", "abc", "1,234,5", "1.2.3,4,5", "-5", "1,555"]) expect(parseMoneyInput(bad)).toBeNull();
  });

  test("RNF-02: formatMoneyText mostra em pt-BR", () => {
    expect(formatMoneyText("1800000.50")).toBe("1.800.000,50");
    expect(formatMoneyText("0.00")).toBe("0,00");
  });

  test("RF-01: ao digitar entrega texto decimal e mostra o valor formatado no início", async () => {
    const onValueChange = vi.fn();
    render(<MoneyField label="Receita" value="" onValueChange={onValueChange} />);
    await userEvent.type(screen.getByLabelText("Receita"), "1.500,5");
    expect(onValueChange).toHaveBeenLastCalledWith("1500.50");
    expect(screen.getByLabelText("Receita")).toHaveAttribute("inputmode", "decimal");
  });

  test("RN-09: texto ilegível mostra um erro, sem perder o que foi digitado", async () => {
    render(<MoneyField label="Receita" value="" onValueChange={() => undefined} />);
    await userEvent.type(screen.getByLabelText("Receita"), "abc");
    expect(screen.getByLabelText("Receita")).toHaveValue("abc");
    expect(screen.getByLabelText("Receita")).toHaveAccessibleDescription(/Digite um valor em reais/);
  });

  test("RNF-02: ao sair do campo mostra o valor formatado", async () => {
    render(<MoneyField label="Receita" value="1800000.00" onValueChange={() => undefined} />);
    expect(screen.getByLabelText("Receita")).toHaveValue("1.800.000,00");
  });
});

describe("PercentField, Select e CheckboxGroup", () => {
  test("RN-09: percentual aceita inteiros de 0 a 100 pelo teclado", async () => {
    const onValueChange = vi.fn();
    render(<PercentField label="B2B" value="" onValueChange={onValueChange} />);
    const input = screen.getByLabelText("B2B");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveAttribute("step", "1");
    await userEvent.type(input, "70");
    expect(onValueChange).toHaveBeenLastCalledWith("0");
  });

  test("RNF-09: Select tem rótulo, opções e mensagem de erro", async () => {
    render(<Select label="UF" placeholder="Escolha" error="Escolha a UF." options={[{ value: "SP", label: "São Paulo" }]} />);
    const select = screen.getByLabelText("UF");
    await userEvent.selectOptions(select, "SP");
    expect(select).toHaveValue("SP");
    expect(select).toHaveAccessibleDescription(/Escolha a UF\./);
  });

  test("RNF-09: CheckboxGroup é um grupo com legenda e alterna as opções", async () => {
    const onChange = vi.fn();
    render(
      <CheckboxGroup legend="Regimes" options={[{ value: "A", label: "Simples" }, { value: "B", label: "Presumido" }]} selected={["A"]} onChange={onChange} />,
    );
    const group = screen.getByRole("group", { name: "Regimes" });
    expect(within(group).getByLabelText("Simples")).toBeChecked();
    await userEvent.click(within(group).getByLabelText("Presumido"));
    expect(onChange).toHaveBeenLastCalledWith(["A", "B"]);
    await userEvent.click(within(group).getByLabelText("Simples"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe("Callout, Disclosure, Badge, Skeleton, SkipLink e Table", () => {
  test("RNF-09: erro usa role=alert; aviso e sucesso, status; informação não interrompe", () => {
    render(
      <>
        <Callout tone="error" title="Falhou">x</Callout>
        <Callout tone="warning" title="Atenção">x</Callout>
        <Callout tone="success" title="Ok">x</Callout>
        <Callout tone="info" title="Nota">x</Callout>
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Erro: Falhou");
    expect(screen.getAllByRole("status")).toHaveLength(2);
    expect(screen.getByText("Informação:")).toBeInTheDocument();
  });

  test("RNF-09: Disclosure abre e fecha", async () => {
    render(<Disclosure summary="Como calculamos">Detalhe</Disclosure>);
    const details = screen.getByText("Como calculamos").closest("details");
    expect(details).not.toHaveAttribute("open");
    await userEvent.click(screen.getByText("Como calculamos"));
    expect(details).toHaveAttribute("open");
  });

  test("RNF-09: Badge sempre tem texto; Skeleton é uma região ocupada com texto de status", () => {
    render(<><Badge>Menor carga</Badge><Skeleton label="Carregando a simulação" /></>);
    expect(screen.getByText("Menor carga")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Carregando a simulação")).toBeInTheDocument();
  });

  test("RNF-09: SkipLink é um link para a âncora do conteúdo", () => {
    render(<SkipLink href="#conteudo">Pular para o conteúdo</SkipLink>);
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute("href", "#conteudo");
  });

  test("RNF-09: Table tem legenda, região rolável focável e cabeçalhos associados", () => {
    render(
      <Table caption="Carga por ano">
        <thead><tr><th scope="col">Ano</th></tr></thead>
        <tbody><tr><th scope="row">2026</th></tr></tbody>
      </Table>,
    );
    const region = screen.getByRole("region", { name: "Carga por ano" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table", { name: "Carga por ano" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Ano" })).toBeInTheDocument();
  });
});

describe("Tabs (padrão APG)", () => {
  const tabs = [
    { id: "a", label: "Simples", panel: <p>Painel A</p> },
    { id: "b", label: "Híbrido", panel: <p>Painel B</p> },
    { id: "c", label: "Presumido", panel: <p>Painel C</p> },
  ];

  test("RNF-09: só a aba ativa entra na ordem de tabulação e só o painel ativo é visível", () => {
    render(<Tabs label="Regimes" tabs={tabs} />);
    const [first, second] = screen.getAllByRole("tab");
    expect(first).toHaveAttribute("tabindex", "0");
    expect(second).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Painel A");
  });

  test("RNF-09: setas, Home e End movem o foco e ativam a aba (com volta circular)", async () => {
    render(<Tabs label="Regimes" tabs={tabs} />);
    const [a, b, c] = screen.getAllByRole("tab") as [HTMLElement, HTMLElement, HTMLElement];
    a.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(b).toHaveFocus();
    expect(b).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Painel B");
    await userEvent.keyboard("{End}");
    expect(c).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(a).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(c).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(a).toHaveFocus();
  });

  test("RNF-09: clicar ativa a aba e o painel fica ligado à aba por aria-labelledby", async () => {
    render(<Tabs label="Regimes" tabs={tabs} />);
    await userEvent.click(screen.getByRole("tab", { name: "Presumido" }));
    expect(screen.getByRole("tabpanel", { name: "Presumido" })).toHaveTextContent("Painel C");
  });
});
