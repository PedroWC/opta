import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { act } from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { NetworkError, ProblemDetailsError, UnexpectedResponseError } from "../../api/errors.ts";
import { AppRoutes } from "../../app/AppRoutes.tsx";
import { expectNoA11yViolations } from "../../test-utils/axe.ts";
import { simulationFixture } from "../../test-utils/fixtures.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { resultLocation } from "../../test-utils/routes.ts";
import { API, problem, server } from "../../test-utils/server.ts";
import { describeError, fieldLabel } from "./describeError.ts";

const renderResult = () =>
  renderWithApi(
    <MemoryRouter initialEntries={[resultLocation()]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe("RNF-07: tradução dos erros da API para o usuário", () => {
  test("RNF-07: falha de rede orienta a verificar a internet e permite tentar de novo", () => {
    expect(describeError(new NetworkError())).toMatchObject({ title: "Sem conexão com o servidor", retryable: true, technical: null });
  });

  test("RNF-07: 5xx e resposta ilegível usam a mensagem padrão, sem jargão, e mantêm o código para o suporte", () => {
    const server500 = describeError(new ProblemDetailsError(500, "SIM-500", "interno"));
    expect(server500).toMatchObject({ title: "Não conseguimos calcular agora", message: "Seus dados foram mantidos. Tente de novo em instantes.", retryable: true, technical: "Código SIM-500 · HTTP 500" });
    expect(describeError(new UnexpectedResponseError())).toMatchObject({ title: "Não conseguimos calcular agora", retryable: true });
    expect(describeError(new Error("estourou"))).toMatchObject({ title: "Algo deu errado" });
    expect(JSON.stringify(describeError(new Error("segredo interno")))).not.toContain("segredo interno");
  });

  test("RNF-07: códigos de regra têm título próprio e a mensagem do servidor como explicação", () => {
    expect(describeError(new ProblemDetailsError(422, "SIM-002", "Não há parâmetros vigentes para 2030."))).toMatchObject({ title: "Faltam premissas para algum ano", message: "Não há parâmetros vigentes para 2030.", retryable: false });
    expect(describeError(new ProblemDetailsError(422, "SIM-003", "RBT12 acima do limite."))).toMatchObject({ title: "Receita acima do limite do Simples Nacional" });
    expect(describeError(new ProblemDetailsError(422, "SIM-004", "Atividade X não suportada."))).toMatchObject({ title: "Atividade fora do escopo desta versão" });
    expect(describeError(new ProblemDetailsError(501, "SIM-999", "x"))).toMatchObject({ title: "Este regime ainda não está disponível nesta versão", retryable: false });
    expect(describeError(new ProblemDetailsError(404, "SIM-005", "x"))).toMatchObject({ title: "Não encontramos o que você procurou" });
    expect(describeError(new ProblemDetailsError(400, "SIM-006", "x"))).toMatchObject({ title: "O pedido não foi aceito", retryable: false });
  });

  test("RNF-07: 422 de validação leva os erros por campo, com o rótulo em português", () => {
    const description = describeError(new ProblemDetailsError(422, "SIM-001", "x", [{ pointer: "/receita_bruta_anual", detail: "Receita bruta anual negativa." }]));
    expect(description.title).toBe("Os dados não foram aceitos");
    expect(description.fields).toEqual([{ pointer: "/receita_bruta_anual", detail: "Receita bruta anual negativa." }]);
    expect(fieldLabel("/receita_bruta_anual")).toBe("Receita bruta anual");
    expect(fieldLabel("/perfil_clientes/b2b_pct")).toBe("Clientes empresas (B2B)");
    expect(fieldLabel("/inexistente")).toBe("Dados informados");
  });
});

describe("RNF-07: estados de erro na tela de resultado", () => {
  test("RNF-07: 422 de validação lista os campos e oferece 'Ajustar dados' (sem 'Tentar de novo')", async () => {
    server.use(
      http.post(`${API}/v1/simulacoes`, () => problem(422, "SIM-001", "Corrija os campos.", [{ pointer: "/folha_anual", detail: "Folha anual negativa." }])),
    );
    renderResult();
    expect(await screen.findByText("Os dados não foram aceitos")).toBeInTheDocument();
    expect(screen.getByText("Folha de pagamento anual: Folha anual negativa.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tentar de novo" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Ajustar dados" }).length).toBeGreaterThan(0);
  });

  test("RNF-07: faltar vigência de premissas (SIM-002) explica qual ano, sem resultado parcial", async () => {
    server.use(http.post(`${API}/v1/simulacoes`, () => problem(422, "SIM-002", "Não há parâmetros vigentes em ALIQUOTA_TRANSICAO para o ano 2031.")));
    renderResult();
    expect(await screen.findByText("Faltam premissas para algum ano")).toBeInTheDocument();
    expect(screen.getByText(/para o ano 2031/)).toBeInTheDocument();
  });

  test("RNF-07: erro de servidor mostra 'Tentar de novo' e esconde o código atrás de 'Detalhes para o suporte'", async () => {
    server.use(http.post(`${API}/v1/simulacoes`, () => problem(500, "SIM-500", "Erro.")));
    renderResult();
    expect(await screen.findByText("Não conseguimos calcular agora")).toBeInTheDocument();
    expect(screen.getByText("Seus dados foram mantidos. Tente de novo em instantes.")).toBeInTheDocument();
    const details = screen.getByText("Detalhes para o suporte").closest("details") as HTMLElement;
    expect(details).not.toHaveAttribute("open");
    await userEvent.click(screen.getByText("Detalhes para o suporte"));
    expect(within(details).getByText("Código SIM-500 · HTTP 500")).toBeInTheDocument();
  });

  test("RNF-07: sem rede mostra a mensagem de conexão e, ao voltar, 'Tentar de novo' funciona", async () => {
    let online = false;
    server.use(http.post(`${API}/v1/simulacoes`, () => (online ? HttpResponse.json(simulationFixture) : HttpResponse.error())));
    renderResult();
    expect(await screen.findByText("Sem conexão com o servidor")).toBeInTheDocument();
    online = true;
    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByRole("heading", { name: "Fique no Simples Nacional" })).toBeInTheDocument();
  });

  test("RNF-07: na página de premissas o erro usa o mesmo painel", async () => {
    server.use(http.get(`${API}/v1/premissas/aliquotas`, () => HttpResponse.error()));
    renderWithApi(
      <MemoryRouter initialEntries={["/premissas"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(await screen.findByText("Sem conexão com o servidor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar de novo" })).toBeInTheDocument();
  });

  test("RNF-09: o painel de erro, aberto, não tem violações do axe", async () => {
    server.use(http.post(`${API}/v1/simulacoes`, () => problem(500, "SIM-500", "Erro.")));
    const view = renderResult();
    await screen.findByText("Não conseguimos calcular agora");
    await userEvent.click(screen.getByText("Detalhes para o suporte"));
    await expectNoA11yViolations(view.container);
  });
});

describe("RF-03: empate entre regimes", () => {
  test("RN-08: sem economia, explica o empate em vez de prometer vantagem", async () => {
    server.use(
      http.post(`${API}/v1/simulacoes`, () =>
        HttpResponse.json({
          ...simulationFixture,
          recomendacao: { ...simulationFixture.recomendacao, economia_acumulada: "0.00", fator_decisivo: { codigo: "NENHUM", diferenca: "0.00" } },
        }),
      ),
    );
    renderResult();
    expect(await screen.findByText(/Os regimes empatam na carga acumulada de 2026–2033/)).toBeInTheDocument();
    expect(screen.queryByText(/Economia acumulada/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Por quê/)).not.toBeInTheDocument();
  });
});

describe("RNF-07: estado offline do navegador", () => {
  const setOnline = (value: boolean): void => {
    Object.defineProperty(navigator, "onLine", { value, configurable: true });
    act(() => {
      window.dispatchEvent(new Event(value ? "online" : "offline"));
    });
  };

  test("RNF-07: o aviso aparece ao perder a conexão e some ao voltar", async () => {
    renderWithApi(
      <MemoryRouter initialEntries={["/sobre"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.queryByText("Você está sem conexão")).not.toBeInTheDocument();
    setOnline(false);
    expect(await screen.findByText(/Você está sem conexão/)).toBeInTheDocument();
    expect(screen.getByText(/Resultados já abertos continuam na tela/)).toBeInTheDocument();
    setOnline(true);
    expect(screen.queryByText(/Você está sem conexão/)).not.toBeInTheDocument();
  });

  test("RNF-09: com o aviso de offline visível a página não tem violações do axe", async () => {
    const view = renderWithApi(
      <MemoryRouter initialEntries={["/sobre"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    setOnline(false);
    await screen.findByText(/Você está sem conexão/);
    await expectNoA11yViolations(view.container);
    setOnline(true);
  });
});
