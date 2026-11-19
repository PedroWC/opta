import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { AppRoutes } from "../../app/AppRoutes.tsx";
import { expectNoA11yViolations } from "../../test-utils/axe.ts";
import { requestFixture, simulationFixture } from "../../test-utils/fixtures.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { chartData, regimesOf } from "./chartData.ts";
import CostChart from "./CostChart.tsx";

describe("RF-08: dados do gráfico", () => {
  test("RF-08: um ponto por ano, com a carga de cada regime em número (só para desenhar)", () => {
    const data = chartData(simulationFixture);
    expect(data).toHaveLength(8);
    expect(data[0]).toEqual({ ano: 2026, SIMPLES: 24240, SIMPLES_HIBRIDO: 36114.96, LUCRO_PRESUMIDO: 54060 });
    expect(data[7]?.ano).toBe(2033);
    expect(regimesOf(simulationFixture)).toEqual(["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"]);
  });

  test("RF-08: sem anos não há regimes nem pontos", () => {
    expect(regimesOf({ ...simulationFixture, anos: [] })).toEqual([]);
    expect(chartData({ ...simulationFixture, anos: [] })).toEqual([]);
  });
});

describe("US-09 e RNF-09: o gráfico não depende só de cor", () => {
  test("RNF-09: tem texto alternativo que remete à tabela e legenda com marcador, traço e rótulo", () => {
    const { container } = render(<CostChart simulation={simulationFixture} />);
    const chart = screen.getByRole("img", { name: /Gráfico de linhas: carga tributária por ano, de 2026 a 2033/ });
    expect(chart).toHaveAccessibleName(/Os mesmos valores estão na tabela comparativa abaixo\./);
    const legend = screen.getByRole("list", { name: "Legenda do gráfico" });
    expect(within(legend).getAllByRole("listitem").map((item) => item.textContent?.trim())).toEqual([
      "■ Simples Nacional",
      "◆ Simples híbrido",
      "● Lucro Presumido",
    ]);
    // três séries desenhadas, com traços diferentes (sólido, tracejado, pontilhado)
    const dashes = [...container.querySelectorAll(".recharts-line-curve")].map((path) => path.getAttribute("stroke-dasharray"));
    expect(dashes).toEqual([null, "8 4", "2 4"]);
  });

  test("RNF-09: cada série tem um marcador de forma própria em todos os anos", () => {
    const { container } = render(<CostChart simulation={simulationFixture} />);
    expect(container.querySelectorAll("rect[width='8']").length).toBe(8); // quadrado: Simples
    expect(container.querySelectorAll("polygon").length).toBe(8); // losango: híbrido
    expect(container.querySelectorAll("circle[r='4']").length).toBe(8); // círculo: Lucro Presumido
  });

  test("RNF-09: o rótulo direto aparece só na ponta de cada linha", () => {
    const { container } = render(<CostChart simulation={simulationFixture} />);
    const labels = [...container.querySelectorAll("text")].map((node) => node.textContent);
    for (const name of ["Simples Nacional", "Simples híbrido", "Lucro Presumido"]) {
      expect(labels.filter((text) => text === name)).toHaveLength(1);
    }
  });

  test("RNF-09: o gráfico e a legenda não têm violações do axe", async () => {
    const { container } = render(<CostChart simulation={simulationFixture} />);
    await expectNoA11yViolations(container);
  });
});

describe("RF-08: gráfico e tabela na tela de resultado", () => {
  const renderResult = () =>
    renderWithApi(
      <MemoryRouter initialEntries={[{ pathname: "/resultado", state: { request: requestFixture } }]}>
        <AppRoutes />
      </MemoryRouter>,
    );

  test("RF-08: o gráfico carrega sob demanda e a tabela equivalente fica sempre disponível", async () => {
    renderResult();
    expect(await screen.findByRole("img", { name: /Gráfico de linhas/ })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Carga tributária por ano e regime" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Gráfico" })).toBeChecked();
  });

  test("US-09: quem prefere só a tabela esconde o gráfico, e a tabela continua lá", async () => {
    renderResult();
    await screen.findByRole("img", { name: /Gráfico de linhas/ });
    await userEvent.click(screen.getByRole("radio", { name: "Só a tabela" }));
    expect(screen.queryByRole("img", { name: /Gráfico de linhas/ })).not.toBeInTheDocument();
    expect(screen.getByText("A tabela abaixo traz os mesmos valores do gráfico.")).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Carga tributária por ano e regime" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "Gráfico" }));
    expect(await screen.findByRole("img", { name: /Gráfico de linhas/ })).toBeInTheDocument();
  });

  test("RNF-09: a seção com gráfico não tem violações do axe e o seletor é um grupo com legenda", async () => {
    const view = renderResult();
    await screen.findByRole("img", { name: /Gráfico de linhas/ });
    expect(screen.getByRole("group", { name: "Ver como" })).toBeInTheDocument();
    await expectNoA11yViolations(view.container);
  });
});
