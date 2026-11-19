import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { AppRoutes } from "../app/AppRoutes.tsx";
import { activityFixture, assumptionsFixture } from "../test-utils/fixtures.ts";
import { expectNoA11yViolations } from "../test-utils/axe.ts";
import { mockScreen } from "../test-utils/media.ts";
import { renderWithApi } from "../test-utils/render.tsx";
import { API, problem, server } from "../test-utils/server.ts";

const renderAt = (entry: string) =>
  renderWithApi(
    <MemoryRouter initialEntries={[entry]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("RF-04 e UC-02: premissas de transição por ano", () => {
  test("RF-04: mostra a versão das premissas e o texto sobre a regulamentação, com link para as fontes", async () => {
    renderAt("/premissas");
    expect(await screen.findByText("Premissas v2026.1")).toBeInTheDocument();
    expect(screen.getByText(/dependem de regulamentação/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "fontes e os limites desta versão" })).toHaveAttribute("href", "/sobre");
  });

  test("RF-04: carrega com esqueleto e depois mostra a tabela com os 8 anos", async () => {
    renderAt("/premissas");
    expect(screen.getByText("Carregando as premissas…")).toBeInTheDocument();
    const table = await screen.findByRole("table", { name: "Transição da CBS e do IBS por ano" });
    expect(within(table).getAllByRole("row")).toHaveLength(1 + 8);
    expect(within(table).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Ano", "CBS", "IBS", "ICMS e ISS", "PIS e Cofins"]);
  });

  test("RN-02: 2026 é ano de teste (CBS 0,90% e IBS 0,10%, compensados) e PIS/Cofins ainda vigoram", async () => {
    renderAt("/premissas");
    const row = within(await screen.findByRole("table")).getByRole("row", { name: /^2026/ });
    expect(within(row).getAllByText("0,90% (teste, compensada)")).toHaveLength(1);
    expect(within(row).getByText("0,10% (teste, compensada)")).toBeInTheDocument();
    expect(within(row).getAllByText("vigentes")).toHaveLength(2); // ICMS/ISS e PIS/Cofins
  });

  test("RN-02: 2029 tem IBS de 1,77%, ICMS/ISS em 90% e PIS/Cofins extintos; 2033 extingue ICMS/ISS", async () => {
    renderAt("/premissas");
    const table = await screen.findByRole("table");
    const row2029 = within(table).getByRole("row", { name: /^2029/ });
    expect(within(row2029).getByText("1,77%")).toBeInTheDocument();
    expect(within(row2029).getByText("90% vigentes")).toBeInTheDocument();
    expect(within(row2029).getByText("extintos")).toBeInTheDocument();
    const row2033 = within(table).getByRole("row", { name: /^2033/ });
    expect(within(row2033).getByText("17,70%")).toBeInTheDocument();
    expect(within(row2033).getAllByText("extintos")).toHaveLength(2);
  });

  test("US-08: em tela estreita vira um cartão por ano", async () => {
    mockScreen({ narrow: true });
    renderAt("/premissas");
    expect(await screen.findByRole("region", { name: "2029" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "2029" })).getByText("90% vigentes")).toBeInTheDocument();
  });

  test("RNF-07: se a API falhar mostra erro com 'Tentar de novo', que recarrega", async () => {
    let calls = 0;
    server.use(
      http.get(`${API}/v1/premissas/aliquotas`, () => {
        calls += 1;
        return calls === 1 ? problem(500, "SIM-500", "Erro.") : HttpResponse.json(assumptionsFixture);
      }),
    );
    renderAt("/premissas");
    expect(await screen.findByText("Não conseguimos calcular agora")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});

describe("RF-05 e UC-03: consulta de atividade", () => {
  test("RF-05: digitar o código mostra o cartão e o atalho que leva o CNAE ao simulador", async () => {
    renderAt("/premissas");
    await userEvent.type(screen.getByRole("combobox", { name: /Atividade/ }), "6201-5/01");
    expect(await screen.findByText("Desenvolvimento de programas de computador sob encomenda")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Usar esta atividade no simulador" }));
    expect(await screen.findByLabelText(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
    expect(screen.getByRole("heading", { level: 1, name: "Qual regime compensa na Reforma Tributária?" })).toBeInTheDocument();
  });

  test("RF-05: busca por texto lista, escolhe e mostra o cartão", async () => {
    renderAt("/premissas");
    await userEvent.type(screen.getByRole("combobox", { name: /Atividade/ }), "programas");
    await userEvent.click(await screen.findByRole("option", { name: /6201-5\/01/ }));
    expect(await screen.findByText(/Anexo V; passa ao Anexo III/)).toBeInTheDocument();
  });

  test("RF-05: CNAE que a API não conhece avisa com o exemplo de código", async () => {
    server.use(http.get(`${API}/v1/atividades`, () => problem(404, "SIM-005", "Atividade não encontrado.")));
    renderAt("/premissas");
    await userEvent.type(screen.getByRole("combobox", { name: /Atividade/ }), "0111-3/01");
    expect(await screen.findByText(/Não encontramos esse CNAE/)).toBeInTheDocument();
  });

  test("RN-09: ?cnae= válido preenche o CNAE no simulador; inválido é ignorado", async () => {
    const valid = renderAt("/?cnae=6201-5/01");
    expect(await screen.findByLabelText(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
    valid.unmount();
    renderAt("/?cnae=<script>");
    expect(await screen.findByLabelText(/Atividade \(CNAE\)/)).toHaveValue("");
  });

  test("RNF-09: a página de premissas não tem violações do axe (larga e estreita)", async () => {
    server.use(http.get(`${API}/v1/atividades`, () => HttpResponse.json(activityFixture)));
    const wide = renderAt("/premissas");
    await screen.findByRole("table");
    await expectNoA11yViolations(wide.container);
    wide.unmount();
    mockScreen({ narrow: true });
    const narrow = renderAt("/premissas");
    await screen.findByRole("region", { name: "2026" });
    await expectNoA11yViolations(narrow.container);
  });
});
