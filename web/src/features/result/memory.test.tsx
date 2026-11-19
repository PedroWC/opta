import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { AppRoutes } from "../../app/AppRoutes.tsx";
import { expectNoA11yViolations } from "../../test-utils/axe.ts";
import { resultLocation } from "../../test-utils/routes.ts";
import { mockScreen } from "../../test-utils/media.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { taxName } from "./taxNames.ts";

const renderResult = () =>
  renderWithApi(
    <MemoryRouter initialEntries={[resultLocation()]}>
      <AppRoutes />
    </MemoryRouter>,
  );

const openYear = async (year: string) => {
  const memory = (await screen.findByRole("heading", { level: 2, name: "Memória de cálculo" })).closest("section") as HTMLElement;
  await userEvent.click(within(memory).getByText(year));
  return memory;
};

describe("RN: nomes legíveis dos tributos", () => {
  test("RF-06: códigos conhecidos têm nome em português e os desconhecidos aparecem como vieram", () => {
    expect(taxName("DAS")).toBe("DAS (guia única do Simples)");
    expect(taxName("CBS_CREDITO")).toBe("CBS: crédito (compras)");
    expect(taxName("IRPJ_ADICIONAL")).toBe("IRPJ adicional");
    expect(taxName("NOVO_TRIBUTO")).toBe("NOVO_TRIBUTO");
  });
});

describe("RF-06 e US-04: memória de cálculo por ano e regime", () => {
  test("US-04: há um item por ano, de 2026 a 2033, e o conteúdo só é montado quando abre", async () => {
    renderResult();
    const memory = (await screen.findByRole("heading", { level: 2, name: "Memória de cálculo" })).closest("section") as HTMLElement;
    const summaries = [...memory.querySelectorAll("summary")].map((node) => node.textContent);
    expect(summaries).toEqual(["2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033"]);
    expect(within(memory).queryByRole("tablist")).not.toBeInTheDocument();
  });

  test("US-04: ao abrir um ano, as abas por regime aparecem com o de menor carga selecionado", async () => {
    renderResult();
    const memory = await openYear("2029");
    const tabs = within(memory).getAllByRole("tab");
    expect(tabs.map((tab) => tab.textContent)).toEqual(["■ Simples Nacional (menor carga)", "◆ Simples híbrido", "● Lucro Presumido"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(within(memory).getByRole("tablist", { name: "Regimes de 2029" })).toBeInTheDocument();
  });

  test("RF-06: a tabela mostra tributo, base, alíquota, valor e fonte legal, com a partilha como detalhe", async () => {
    renderResult();
    const memory = await openYear("2026");
    const table = within(memory).getByRole("table", { name: "Memória de cálculo de 2026: Simples Nacional" });
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Tributo", "Base", "Alíquota", "Valor", "Fonte legal"]);
    const das = within(table).getByRole("row", { name: /DAS \(guia única do Simples\)/ });
    expect(within(das).getByText("R$ 300.000,00")).toBeInTheDocument();
    expect(within(das).getByText("8,08%")).toBeInTheDocument();
    expect(within(das).getByText("R$ 24.240,00")).toBeInTheDocument();
    expect(within(das).getByText("LC 123/2006, Anexo III, 2ª faixa")).toBeInTheDocument();
    const irpj = within(table).getByRole("row", { name: /IRPJ/ });
    expect(within(irpj).getByText("R$ 969,60")).toBeInTheDocument();
    expect(within(irpj).getByText(/detalhe, não soma ao total/)).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /Carga total do ano/ })).toHaveTextContent("R$ 24.240,00");
  });

  test("US-04: trocar de aba mostra outro regime e a fonte de cada linha", async () => {
    renderResult();
    const memory = await openYear("2026");
    await userEvent.click(within(memory).getByRole("tab", { name: /Lucro Presumido/ }));
    const table = within(memory).getByRole("table", { name: "Memória de cálculo de 2026: Lucro Presumido" });
    expect(within(table).getByText("Lei 9.249/1995")).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /Carga total do ano/ })).toHaveTextContent("R$ 54.060,00");
  });

  test("US-08: em tela estreita cada tributo vira um bloco em lista de definição, sem tabela", async () => {
    mockScreen({ narrow: true });
    renderResult();
    const memory = await openYear("2026");
    expect(within(memory).queryByRole("table")).not.toBeInTheDocument();
    const block = within(memory).getByRole("region", { name: "DAS (guia única do Simples)" });
    expect(within(block).getByText("Fonte legal").tagName).toBe("DT");
    expect(within(block).getByText("LC 123/2006, Anexo III, 2ª faixa")).toBeInTheDocument();
    expect(within(block).getByText(/Detalhe: IRPJ/)).toBeInTheDocument();
    expect(within(memory).getByText(/Carga total do ano: R\$ 24\.240,00/)).toBeInTheDocument();
  });

  test("US-04: 'Ver como calculamos' leva o foco à memória de cálculo sem mexer na URL", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    renderResult();
    await userEvent.click(await screen.findByRole("button", { name: "Ver como calculamos" }));
    expect(screen.getByRole("heading", { level: 2, name: "Memória de cálculo" })).toHaveFocus();
    expect(scrollIntoView).toHaveBeenCalled();
  });

  test("RNF-09: a memória com um ano aberto, larga e estreita, não tem violações do axe", async () => {
    const wide = renderResult();
    await openYear("2026");
    await expectNoA11yViolations(wide.container);
    wide.unmount();
    mockScreen({ narrow: true });
    const narrow = renderResult();
    await openYear("2026");
    await expectNoA11yViolations(narrow.container);
  });
});
