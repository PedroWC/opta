import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { AppRoutes } from "../app/AppRoutes.tsx";
import { formatBRL, formatRate, sumMoney } from "../lib/format.ts";
import { requestFixture, simulationFixture } from "../test-utils/fixtures.ts";
import { expectNoA11yViolations } from "../test-utils/axe.ts";
import { mockScreen } from "../test-utils/media.ts";
import { renderWithApi } from "../test-utils/render.tsx";
import { API, problem, server } from "../test-utils/server.ts";

const renderResult = (state: unknown = { request: requestFixture }) =>
  renderWithApi(
    <MemoryRouter initialEntries={[{ pathname: "/resultado", state }]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("RNF-02: formatação em pt-BR sem usar number", () => {
  test("RNF-02: formatBRL, formatRate e sumMoney", () => {
    expect(formatBRL("1800000.50")).toBe("R$ 1.800.000,50");
    expect(formatBRL("-12.30")).toBe("-R$ 12,30");
    expect(formatRate("8.0800")).toBe("8,08%");
    expect(formatRate("12.0383")).toBe("12,04%");
    expect(formatRate("0.0050")).toBe("0,01%");
    expect(formatRate("100.0000")).toBe("100,00%");
    expect(sumMoney(["24240.00", "36114.96", "0.04"])).toBe("60355.00");
    expect(sumMoney([])).toBe("0.00");
  });
});

describe("US-01: resultado da simulação (recomendação e tabela)", () => {
  test("US-01: sem simulação aberta explica e leva ao simulador", () => {
    renderResult(null);
    expect(screen.getByText(/Nenhuma simulação aberta/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para o simulador" })).toHaveAttribute("href", "/");
  });

  test("US-09: carregando mostra o esqueleto com texto; depois leva o foco ao h1 e anuncia o melhor regime", async () => {
    renderResult();
    expect(screen.getByText("Calculando 8 anos e 3 regimes…")).toBeInTheDocument();
    const heading = screen.getByRole("heading", { level: 1, name: "Resultado da simulação" });
    expect(await screen.findByText("Resultado pronto. Melhor regime: Simples Nacional.")).toBeInTheDocument();
    expect(heading).toHaveFocus();
  });

  test("RF-03: a recomendação mostra o regime, o selo, a economia e o fator decisivo", async () => {
    renderResult();
    expect(await screen.findByRole("heading", { level: 2, name: "Fique no Simples Nacional" })).toBeInTheDocument();
    const card = screen.getByRole("region", { name: "Fique no Simples Nacional" });
    expect(within(card).getByText("Menor carga")).toBeInTheDocument();
    expect(within(card).getByText("R$ 130.431,12")).toBeInTheDocument();
    expect(within(card).getByText(/em relação ao Simples híbrido/)).toBeInTheDocument();
    expect(within(card).getByText(/tributos sobre o consumo/)).toBeInTheDocument();
    expect(within(card).getByText(/não é garantia nem consultoria tributária/)).toBeInTheDocument();
  });

  test("RF-02 e RN-08: a tabela traz 8 anos, o regime de menor carga de cada ano e o total acumulado", async () => {
    renderResult();
    const table = await screen.findByRole("table", { name: "Carga tributária por ano e regime" });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 8 + 1);
    expect(within(table).getByRole("columnheader", { name: /Simples Nacional/ })).toBeInTheDocument();
    const row2026 = within(table).getByRole("row", { name: /^2026/ });
    expect(within(row2026).getByText("R$ 24.240,00")).toBeInTheDocument();
    expect(within(row2026).getByText("8,08%")).toBeInTheDocument();
    expect(within(row2026).getByText("Simples Nacional")).toBeInTheDocument(); // coluna "Menor carga"
    const total = within(table).getByRole("row", { name: /Total 2026–2033/ });
    expect(within(total).getByText("R$ 193.920,00")).toBeInTheDocument(); // 8 x 24.240,00
    expect(within(total).getByText("R$ 288.919,68")).toBeInTheDocument(); // 8 x 36.114,96
    expect(within(total).getByText("R$ 432.480,00")).toBeInTheDocument(); // 8 x 54.060,00
  });

  test("RF-02: em tela estreita a tabela vira um cartão por ano, mais o total", async () => {
    mockScreen({ narrow: true });
    renderResult();
    expect(await screen.findByRole("region", { name: "2026" })).toBeInTheDocument();
    expect(screen.getAllByRole("region").filter((region) => /^\d{4}$/.test(region.getAttribute("aria-label") ?? "")).length).toBe(0);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Total 2026–2033" })).toBeInTheDocument();
    expect(screen.getAllByText(/\(menor carga\)/).length).toBeGreaterThan(0);
  });

  test("RF-03: regimes que não se aplicam aparecem em aviso, e os avisos da API são listados", async () => {
    server.use(
      http.post(`${API}/v1/simulacoes`, () =>
        HttpResponse.json({
          ...simulationFixture,
          regimes_indisponiveis: [{ regime: "SIMPLES", codigo: "SIM-003", detalhe: "RBT12 de 5000000.00 acima do limite do Simples Nacional (4800000.00)." }],
          avisos: ["Aviso A da legislação.", "Aviso B da legislação."],
        }),
      ),
    );
    renderResult();
    expect(await screen.findByText("Simples Nacional não se aplica")).toBeInTheDocument();
    expect(screen.getByText(/acima do limite do Simples Nacional/)).toBeInTheDocument();
    const notices = screen.getByRole("heading", { level: 2, name: "Avisos" }).parentElement as HTMLElement;
    expect(within(notices).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Aviso A da legislação.", "Aviso B da legislação."]);
  });

  test("RF-03: sem recomendação (nenhum regime calculado) não inventa uma", async () => {
    server.use(http.post(`${API}/v1/simulacoes`, () => HttpResponse.json({ ...simulationFixture, recomendacao: null })));
    renderResult();
    expect(await screen.findByText("Resultado pronto. Nenhum regime pôde ser calculado.")).toBeInTheDocument();
    expect(screen.queryByText(/Fique no/)).not.toBeInTheDocument();
  });

  test("RF-03: com um único regime não há economia para comparar", async () => {
    server.use(
      http.post(`${API}/v1/simulacoes`, () =>
        HttpResponse.json({
          ...simulationFixture,
          recomendacao: { ...simulationFixture.recomendacao, segundo_colocado: null, economia_acumulada: "0.00", fator_decisivo: { codigo: "NENHUM", diferenca: "0.00" } },
        }),
      ),
    );
    renderResult();
    expect(await screen.findByText("Só um regime pôde ser calculado para esta empresa.")).toBeInTheDocument();
  });

  test("RNF-07: se o cálculo falhar mostra erro com 'Tentar de novo', que refaz a chamada", async () => {
    let calls = 0;
    server.use(
      http.post(`${API}/v1/simulacoes`, () => {
        calls += 1;
        return calls === 1 ? problem(500, "SIM-500", "Erro.") : HttpResponse.json(simulationFixture);
      }),
    );
    renderResult();
    expect(await screen.findByText("Não foi possível calcular agora")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Fique no Simples Nacional" })).toBeInTheDocument();
  });

  test("RF-09: 'Ajustar dados' volta ao formulário já preenchido", async () => {
    renderResult();
    await screen.findByRole("heading", { name: "Fique no Simples Nacional" });
    await userEvent.click(screen.getByRole("link", { name: "Ajustar dados" }));
    expect(await screen.findByLabelText(/Receita bruta anual/)).toHaveValue("300.000,00");
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveValue("8630-5/04");
    expect(screen.getByLabelText(/Alíquota de ISS/)).toHaveValue("5,00");
  });

  test("RNF-09: o resultado, largo e estreito, não tem violações do axe", async () => {
    const wide = renderResult();
    await screen.findByRole("table");
    await expectNoA11yViolations(wide.container);
    wide.unmount();
    mockScreen({ narrow: true });
    const narrow = renderResult();
    await screen.findByRole("heading", { level: 3, name: "Total 2026–2033" });
    await expectNoA11yViolations(narrow.container);
  });
});
