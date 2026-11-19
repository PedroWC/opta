import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { expectNoA11yViolations } from "../test-utils/axe.ts";
import { AppRoutes } from "./AppRoutes.tsx";

const renderAt = (path: string, version?: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes assumptionsVersion={version} />
    </MemoryRouter>,
  );

describe("RF-11: aviso legal e estrutura em todas as telas", () => {
  test.each(["/", "/resultado", "/premissas", "/sobre", "/nada-aqui"])("RF-11: %s mostra o aviso de simulador educacional no rodapé", (path) => {
    renderAt(path);
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/Simulador educacional\. Não substitui o seu contador nem é consultoria tributária\./)).toBeInTheDocument();
  });

  test("RF-11: o aviso inclui a versão das premissas quando ela é conhecida", () => {
    renderAt("/", "2026.1");
    expect(within(screen.getByRole("contentinfo")).getByText(/Premissas v2026\.1\./)).toBeInTheDocument();
  });

  test("RNF-09: cada tela tem um único main, um h1 e o pular link como primeiro item focável", async () => {
    renderAt("/");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "Pular para o conteúdo" })).toHaveAttribute("href", "#conteudo");
  });
});

describe("Navegação e rotas", () => {
  test("RNF-09: a navegação principal tem 3 itens e marca a página atual com aria-current", () => {
    renderAt("/premissas");
    const nav = screen.getByRole("navigation", { name: "Principal" });
    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Simulador", "Premissas", "Metodologia"]);
    expect(within(nav).getByRole("link", { name: "Premissas" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Simulador" })).not.toHaveAttribute("aria-current");
  });

  test.each([
    ["/", "Simulador de regimes", "Simulador — Opta"],
    ["/resultado", "Resultado da simulação", "Resultado — Opta"],
    ["/premissas", "Premissas de alíquotas", "Premissas — Opta"],
    ["/sobre", "Metodologia", "Metodologia — Opta"],
  ])("RNF-09: %s mostra o título da página e atualiza o título da aba", (path, heading, title) => {
    renderAt(path);
    expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    expect(document.title).toBe(title);
  });

  test("US-10: rota inexistente mostra a página 404 com caminho de volta", () => {
    renderAt("/nao-existe");
    expect(screen.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao simulador" })).toHaveAttribute("href", "/");
    expect(document.title).toBe("Página não encontrada — Opta");
  });

  test("RNF-09: ao navegar, anuncia a nova página e leva o foco ao conteúdo; na primeira carga não mexe no foco", async () => {
    renderAt("/");
    expect(screen.getByRole("main")).not.toHaveFocus();
    expect(screen.queryByText(/^Página:/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Metodologia" }));
    expect(screen.getByRole("main")).toHaveFocus();
    expect(screen.getByText("Página: Metodologia — Opta")).toBeInTheDocument();
  });
});

describe("RF-11: página de metodologia", () => {
  test("RF-11: traz limites, fontes legais, privacidade e glossário com abreviações", () => {
    renderAt("/sobre");
    for (const heading of ["O que o Opta faz", "Limites desta versão", "Fontes legais", "Como ler a memória de cálculo", "Privacidade", "Código e decisões"]) {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    }
    expect(screen.getByText("CBS")).toHaveAttribute("title", "Contribuição sobre Bens e Serviços");
    expect(screen.getByText(/Lei Complementar 214\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/ISS e ICMS saem do DAS/)).toBeInTheDocument();
  });
});

describe("RNF-09: axe em cada tela", () => {
  test.each(["/", "/resultado", "/premissas", "/sobre", "/nada-aqui"])("%s não tem violações do axe", async (path) => {
    const { container } = renderAt(path, "2026.1");
    await expectNoA11yViolations(container);
  });
});
