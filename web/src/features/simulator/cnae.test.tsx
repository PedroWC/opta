import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, test, vi } from "vitest";
import type { Activity } from "../../api/types.ts";
import { activityFixture } from "../../test-utils/fixtures.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { API, problem, server } from "../../test-utils/server.ts";
import { EXAMPLE_VALUES } from "./schema.ts";
import { SimulatorForm } from "./SimulatorForm.tsx";

// Comércio não tem anexo do Simples no MVP: o campo é omitido.
const commerceWithoutAnnex: Activity = {
  cnae: "4711-3/02",
  descricao: "Comércio varejista de mercadorias em geral - supermercados",
  natureza: "COMERCIO",
  usa_fator_r: false,
  presuncao_irpj: "8.0000",
  presuncao_csll: "12.0000",
};

const setup = () => ({ user: userEvent.setup(), ...renderWithApi(<SimulatorForm onSubmit={vi.fn()} />) });

describe("RF-05 e US-03: combobox de CNAE no formulário", () => {
  test("RF-05: digitar parte da descrição busca (com espera), lista e escolhe a atividade, mostrando o cartão", async () => {
    const queries: string[] = [];
    server.use(
      http.get(`${API}/v1/atividades`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.has("cnae")) return HttpResponse.json(activityFixture);
        queries.push(url.searchParams.get("q") ?? "");
        return HttpResponse.json({ itens: [activityFixture], pagina: 1, tem_proxima: false });
      }),
    );
    const { user } = setup();
    const input = screen.getByRole("combobox", { name: /Atividade/ });
    await user.type(input, "programas");
    const option = await screen.findByRole("option", { name: /6201-5\/01 — Desenvolvimento de programas/ });
    expect(queries).toEqual(["programas"]); // uma só chamada: as teclas intermediárias foram agrupadas
    await user.click(option);
    expect(input).toHaveValue("6201-5/01");
    expect(await screen.findByText("Desenvolvimento de programas de computador sob encomenda")).toBeInTheDocument();
    expect(screen.getByText(/Anexo V; passa ao Anexo III se o Fator R for de 28% ou mais/)).toBeInTheDocument();
    expect(screen.getByText(/presunção de 32% para o IRPJ e 32% para a CSLL/)).toBeInTheDocument();
  });

  test("RF-05: com o código completo digitado não lista, e o cartão confirma a atividade", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox", { name: /Atividade/ }), "6201-5/01");
    expect(await screen.findByText("Desenvolvimento de programas de computador sob encomenda")).toBeInTheDocument();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("US-03: sem resultado mostra a mensagem com o exemplo de código", async () => {
    server.use(http.get(`${API}/v1/atividades`, () => HttpResponse.json({ itens: [], pagina: 1, tem_proxima: false })));
    const { user } = setup();
    await user.type(screen.getByRole("combobox", { name: /Atividade/ }), "zzzz");
    expect(await screen.findByText("Nenhuma atividade encontrada. Tente o código completo, como 6201-5/01.")).toBeInTheDocument();
  });

  test("RF-05: para comércio o rótulo vira ICMS e o cartão avisa que o Simples não é calculado", async () => {
    server.use(http.get(`${API}/v1/atividades`, () => HttpResponse.json(commerceWithoutAnnex)));
    const { user } = setup();
    expect(screen.getByLabelText(/Alíquota de ISS ou ICMS/)).toBeInTheDocument();
    await user.type(screen.getByRole("combobox", { name: /Atividade/ }), "4711-3/02");
    expect(await screen.findByLabelText(/Alíquota de ICMS \*/)).toBeInTheDocument();
    expect(screen.getByText("Simples Nacional indisponível para comércio")).toBeInTheDocument();
    expect(screen.getByText("Comércio (ICMS)")).toBeInTheDocument();
  });

  test("RF-05: para serviço o rótulo vira ISS", async () => {
    const { user } = setup();
    await user.type(screen.getByRole("combobox", { name: /Atividade/ }), "8630-5/04");
    expect(await screen.findByLabelText(/Alíquota de ISS \*/)).toBeInTheDocument();
  });

  test("RNF-07: se a busca falhar, o formulário continua usável e não afirma 'nenhuma atividade'", async () => {
    server.use(http.get(`${API}/v1/atividades`, () => problem(500, "SIM-500", "Erro.")));
    const { user } = setup();
    const input = screen.getByRole("combobox", { name: /Atividade/ });
    await user.type(input, "programas");
    await waitFor(() => expect(input).toHaveAttribute("aria-expanded", "false"));
    expect(screen.queryByText(/Nenhuma atividade encontrada/)).not.toBeInTheDocument();
    await user.clear(input);
    await user.type(input, "6201-5/01");
    expect(input).toHaveValue("6201-5/01");
  });

  test("US-05: o exemplo preenchido já traz o cartão da atividade", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Preencher com um exemplo" }));
    expect(screen.getByRole("combobox", { name: /Atividade/ })).toHaveValue(EXAMPLE_VALUES.cnae);
    expect(await screen.findByText("Desenvolvimento de programas de computador sob encomenda")).toBeInTheDocument();
  });
});
