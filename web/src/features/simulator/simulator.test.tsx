import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { parsePercentInput } from "../../lib/percent.ts";
import { expectNoA11yViolations } from "../../test-utils/axe.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { approximateFatorR } from "./fatorR.ts";
import { EXAMPLE_VALUES, fieldOfPointer, simulatorSchema, toRequest } from "./schema.ts";
import { SimulatorForm } from "./SimulatorForm.tsx";

const setup = (props: Partial<React.ComponentProps<typeof SimulatorForm>> = {}) => {
  const onSubmit = vi.fn();
  const view = renderWithApi(<SimulatorForm onSubmit={onSubmit} {...props} />);
  return { onSubmit, user: userEvent.setup(), ...view };
};

describe("RN-09: a validação do formulário", () => {
  test("RN-09: o exemplo da US-01 é válido e vira o corpo esperado do contrato", () => {
    const parsed = simulatorSchema.safeParse(EXAMPLE_VALUES);
    expect(parsed.success).toBe(true);
    expect(toRequest(EXAMPLE_VALUES)).toEqual({
      cnae: "6201-5/01",
      uf: "SP",
      receita_bruta_anual: "1800000.00",
      folha_anual: "540000.00",
      perfil_clientes: { b2b_pct: 70 },
      compras_creditaveis_pct: 25,
      aliquota_icms_iss: "5.0000",
      regimes: ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"],
    });
  });

  test.each([
    ["cnae", "123", "Informe um CNAE válido, por exemplo 6201-5/01."],
    ["uf", "XX", "Escolha o estado."],
    ["issRate", "150", "Informe um percentual entre 0 e 100."],
    ["revenue", "", "Informe a receita bruta anual (use 0 se não houver)."],
    ["payroll", "abc", "Informe a folha anual (use 0 se não houver)."],
    ["b2b", "120", "Use um número inteiro de 0 a 100."],
    ["purchases", "50.5", "Use um número inteiro de 0 a 100."],
  ] as const)("RN-09: %s inválido mostra a mensagem do campo", (field, value, message) => {
    const result = simulatorSchema.safeParse({ ...EXAMPLE_VALUES, [field]: value });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === field)?.message).toBe(message);
  });

  test("RN-09: sem nenhum regime a validação falha com mensagem própria", () => {
    const result = simulatorSchema.safeParse({ ...EXAMPLE_VALUES, regimes: [] });
    expect(result.error?.issues[0]?.message).toBe("Escolha ao menos um regime para comparar.");
  });

  test("RN-09: percentuais aceitam os limites 0 e 100", () => {
    expect(simulatorSchema.safeParse({ ...EXAMPLE_VALUES, b2b: "0", purchases: "100" }).success).toBe(true);
  });

  test("RN-09: parsePercentInput aceita vírgula e ponto, até 2 casas, de 0 a 100", () => {
    expect(parsePercentInput("5")).toBe("5.0000");
    expect(parsePercentInput("5,25")).toBe("5.2500");
    expect(parsePercentInput("2.5")).toBe("2.5000");
    expect(parsePercentInput("100")).toBe("100.0000");
    expect(parsePercentInput("100,01")).toBeNull();
    expect(parsePercentInput("101")).toBeNull();
    expect(parsePercentInput("5,123")).toBeNull();
    expect(parsePercentInput("abc")).toBeNull();
    expect(parsePercentInput("")).toBeNull();
  });

  test("DEC-14: ponteiros de erro da API ligam ao campo certo do formulário", () => {
    expect(fieldOfPointer("/receita_bruta_anual")).toBe("revenue");
    expect(fieldOfPointer("/perfil_clientes/b2b_pct")).toBe("b2b");
    expect(fieldOfPointer("/aliquota_icms_iss")).toBe("issRate");
    expect(fieldOfPointer("/regimes/0")).toBe("regimes");
    expect(fieldOfPointer("/desconhecido")).toBeNull();
  });
});

describe("DEC-10: Fator R aproximado", () => {
  test("DEC-10: folha ÷ receita em % inteiro, arredondado, sem usar number para dinheiro", () => {
    expect(approximateFatorR("1800000.00", "540000.00")).toBe(30);
    expect(approximateFatorR("300000.00", "0.00")).toBe(0);
    expect(approximateFatorR("3.00", "1.00")).toBe(33);
    expect(approximateFatorR("0.00", "10.00")).toBeNull();
    expect(approximateFatorR("", "10.00")).toBeNull();
    expect(approximateFatorR("100.00", "abc")).toBeNull();
  });
});

describe("US-06: erros claros junto de cada campo", () => {
  test("US-06: enviar vazio mostra o resumo com todos os erros, leva o foco a ele e não envia", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    const summary = await screen.findByRole("alert");
    expect(within(summary).getByRole("heading", { name: "7 campos precisam de ajuste" })).toBeInTheDocument();
    expect(summary).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveAccessibleDescription(/Informe um CNAE válido/);
  });

  test("US-06: cada item do resumo leva ao campo correspondente", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await user.click(await screen.findByRole("link", { name: /Receita bruta anual: Informe a receita/ }));
    expect(screen.getByLabelText(/Receita bruta anual/)).toHaveFocus();
  });

  test("US-06: os dados já digitados são mantidos quando há erro em outro campo", async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText(/Atividade \(CNAE\)/), "6201-5/01");
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await screen.findByRole("alert");
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).not.toHaveAttribute("aria-invalid");
  });

  test("US-06: um único erro usa o singular", async () => {
    const { user } = setup({ initialValues: { ...EXAMPLE_VALUES, cnae: "123" } });
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    expect(await screen.findByRole("heading", { name: "1 campo precisa de ajuste" })).toBeInTheDocument();
  });

  test("RN-09: sem nenhum regime marcado mostra a mensagem do grupo", async () => {
    const { user } = setup({ initialValues: EXAMPLE_VALUES });
    await user.click(screen.getByLabelText("Simples Nacional"));
    await user.click(screen.getByLabelText("Simples híbrido"));
    await user.click(screen.getByLabelText("Lucro Presumido"));
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    expect((await screen.findAllByText(/Escolha ao menos um regime para comparar\./)).length).toBeGreaterThan(0);
  });

  test("DEC-14: erros por campo devolvidos pela API aparecem junto do campo", async () => {
    setup({
      initialValues: EXAMPLE_VALUES,
      serverProblems: [{ pointer: "/receita_bruta_anual", detail: "Receita bruta anual negativa." }],
    });
    expect(await screen.findByLabelText(/Receita bruta anual/)).toHaveAccessibleDescription(/Receita bruta anual negativa\./);
  });
});

describe("US-05 e US-01: exemplo e envio", () => {
  test("US-05: o exemplo preenche tudo, anuncia e leva o foco ao primeiro campo", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Preencher com um exemplo" }));
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveFocus();
    expect(screen.getByLabelText(/UF/)).toHaveValue("SP");
    expect(screen.getByLabelText(/Receita bruta anual/)).toHaveValue("1.800.000,00");
    expect(screen.getByLabelText(/Folha de pagamento anual/)).toHaveValue("540.000,00");
    expect(screen.getByText(/Exemplo preenchido/)).toBeInTheDocument();
  });

  test("US-01: depois do exemplo, enviar entrega o corpo do contrato", async () => {
    const { onSubmit, user } = setup();
    await user.click(screen.getByRole("button", { name: "Preencher com um exemplo" }));
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(toRequest(EXAMPLE_VALUES));
  });

  test("RNF-02: dinheiro digitado em pt-BR vira texto decimal no envio", async () => {
    const { onSubmit, user } = setup({ initialValues: EXAMPLE_VALUES });
    const revenue = screen.getByLabelText(/Receita bruta anual/);
    await user.clear(revenue);
    await user.type(revenue, "300.000,00");
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ receita_bruta_anual: "300000.00" });
  });

  test("RF-01: só os regimes marcados vão na requisição", async () => {
    const { onSubmit, user } = setup({ initialValues: EXAMPLE_VALUES });
    await user.click(screen.getByLabelText("Simples híbrido"));
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ regimes: ["SIMPLES", "LUCRO_PRESUMIDO"] });
  });

  test("RNF-09: enquanto envia, o botão mostra 'Simulando…' e fica inerte, mas focável", async () => {
    const { onSubmit, user } = setup({ initialValues: EXAMPLE_VALUES, submitting: true });
    const button = screen.getByRole("button", { name: /Simulando/ });
    expect(button).toHaveAttribute("aria-disabled", "true");
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("US-01: resumo ao vivo e B2B", () => {
  test("DEC-10: mostra o Fator R aproximado conforme receita e folha", () => {
    setup({ initialValues: EXAMPLE_VALUES });
    expect(screen.getByText(/Fator R aproximado: 30%/)).toBeInTheDocument();
  });

  test("DEC-10: sem receita não mostra a dica", () => {
    setup();
    expect(screen.queryByText(/Fator R aproximado/)).not.toBeInTheDocument();
  });

  test("US-01: o complemento B2C acompanha o B2B e o controle deslizante tem texto de valor", async () => {
    const { user } = setup({ initialValues: EXAMPLE_VALUES });
    expect(screen.getByText("Pessoas físicas (B2C): 30%")).toBeInTheDocument();
    const slider = screen.getByLabelText("Ajuste fino da parcela B2B");
    expect(slider).toHaveAttribute("aria-valuetext", "70% empresas e 30% pessoas físicas");
    const b2b = screen.getByLabelText(/Clientes empresas \(B2B\)/);
    await user.clear(b2b);
    await user.type(b2b, "40");
    expect(screen.getByText("Pessoas físicas (B2C): 60%")).toBeInTheDocument();
  });
});

describe("RNF-09: acessibilidade do formulário", () => {
  test("RNF-09: vazio, preenchido e com erros não têm violações do axe", async () => {
    const empty = setup();
    await expectNoA11yViolations(empty.container);
    empty.unmount();
    const filled = setup({ initialValues: EXAMPLE_VALUES });
    await expectNoA11yViolations(filled.container);
    filled.unmount();
    const withErrors = setup();
    await withErrors.user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await screen.findByRole("alert");
    await expectNoA11yViolations(withErrors.container);
  });

  test("RNF-09: as seções são grupos com legenda", () => {
    setup();
    for (const name of ["1. Sua empresa", /2\. Seus números/, "3. Para quem você vende", "4. O que comparar"]) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
  });
});

describe("Heurísticas 2 e 5: siglas explicadas e prevenção de engano", () => {
  test("heurística 2: CBS, IBS e DAS aparecem com a sigla explicada", () => {
    setup();
    expect(screen.getAllByText("CBS")[0]).toHaveAttribute("title", "Contribuição sobre Bens e Serviços");
    expect(screen.getAllByText("IBS")[0]).toHaveAttribute("title", "Imposto sobre Bens e Serviços");
    expect(screen.getByText("DAS")).toHaveAttribute("title", "Documento de Arrecadação do Simples Nacional");
  });

  test("heurística 5: folha maior que a receita avisa, sem impedir o envio", async () => {
    const { onSubmit, user } = setup({ initialValues: { ...EXAMPLE_VALUES, payroll: "2000000.00" } });
    expect(screen.getByText(/A folha informada é maior que a receita/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });

  test("heurística 5: folha menor ou igual à receita não avisa", () => {
    setup({ initialValues: { ...EXAMPLE_VALUES, payroll: "1800000.00" } });
    expect(screen.queryByText(/A folha informada é maior que a receita/)).not.toBeInTheDocument();
  });
});
