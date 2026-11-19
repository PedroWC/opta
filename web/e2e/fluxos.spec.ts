import { expect, test } from "@playwright/test";
import { expectNoViolations, simulateExample } from "./helpers";

test.describe("US-01: do formulário ao resultado", () => {
  test("o exemplo preenchido gera o resultado com recomendação, tabela e memória de cálculo", async ({ page }) => {
    await simulateExample(page);
    await expect(page).toHaveURL(/\/resultado#v1\./);
    await expect(page.getByRole("heading", { level: 1, name: "Resultado da simulação" })).toBeFocused();
    await expect(page.getByText("Melhor regime:", { exact: false })).toBeAttached();

    const comparison = page.getByRole("table", { name: "Carga tributária por ano e regime" });
    if (await comparison.count()) {
      await expect(comparison.getByRole("row")).toHaveCount(1 + 8 + 1); // cabeçalho, 8 anos e total
      await expect(comparison.getByRole("columnheader", { name: /Simples Nacional/ })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { level: 3, name: "Total 2026–2033" })).toBeVisible(); // celular: cartões
    }

    await page.locator("summary", { hasText: "2029" }).click();
    await expect(page.getByRole("tablist", { name: "Regimes de 2029" })).toBeVisible();
  });

  test("US-02: o resultado compara os três regimes e o gráfico pode ser trocado pela tabela", async ({ page }) => {
    await simulateExample(page);
    await expect(page.getByRole("img", { name: /Gráfico de linhas: carga tributária por ano/ })).toBeVisible();
    await page.getByRole("radio", { name: "Só a tabela" }).check();
    await expect(page.getByRole("img", { name: /Gráfico de linhas/ })).toHaveCount(0);
    for (const regime of ["Simples Nacional", "Simples híbrido", "Lucro Presumido"]) {
      await expect(page.getByText(regime).first()).toBeVisible();
    }
  });

  test("US-07: o link do resultado abre a mesma simulação em outra aba", async ({ page, context }) => {
    await simulateExample(page);
    const heading = await page.getByRole("heading", { level: 2, name: /^Fique no / }).textContent();
    const other = await context.newPage();
    await other.goto(page.url());
    await expect(other.getByRole("heading", { level: 2, name: /^Fique no / })).toHaveText(heading ?? "");
  });

  test("US-07: 'Ajustar dados' volta ao formulário preenchido", async ({ page }) => {
    await simulateExample(page);
    await page.getByRole("link", { name: "Ajustar dados" }).click();
    await expect(page.getByLabel(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
    await expect(page.getByLabel(/Receita bruta anual/)).toHaveValue("1.800.000,00");
  });
});

test.describe("US-06: erros claros", () => {
  test("enviar vazio mostra o resumo, leva o foco a ele e cada item leva ao campo", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Simular regimes" }).click();
    const summary = page.getByRole("alert").filter({ hasText: "campos precisam de ajuste" });
    await expect(summary).toBeFocused();
    await summary.getByRole("link", { name: /Receita bruta anual/ }).click();
    await expect(page.getByLabel(/Receita bruta anual/)).toBeFocused();
    await expectNoViolations(page);
  });

  test("link com dados inválidos cai no formulário com aviso", async ({ page }) => {
    await page.goto("/resultado#v1.dados-invalidos");
    await expect(page.getByText("Alguns dados do link não puderam ser usados")).toBeVisible();
    await expect(page).toHaveURL(/\/#v1\./);
  });

  test("receita acima do teto do Simples mostra o aviso por regime e mantém o Lucro Presumido", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Preencher com um exemplo" }).click();
    const revenue = page.getByLabel(/Receita bruta anual/);
    await revenue.fill("5.000.000,00");
    await page.getByRole("button", { name: "Simular regimes" }).click();
    await expect(page.getByText("Simples Nacional não se aplica")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { level: 2, name: "Fique no Lucro Presumido" })).toBeVisible();
  });
});

test.describe("US-03: premissas e atividades", () => {
  test("a página de premissas mostra a transição de 2026 a 2033 e consulta uma atividade", async ({ page }) => {
    await page.goto("/premissas");
    await expect(page.getByText("Premissas v2026.1", { exact: true })).toBeVisible();
    const rows = page.getByRole("table", { name: "Transição da CBS e do IBS por ano" }).getByRole("row");
    if (await rows.count()) await expect(rows).toHaveCount(1 + 8);
    await page.getByRole("combobox", { name: /Atividade/ }).fill("6201-5/01");
    await expect(page.getByText("Desenvolvimento de programas de computador sob encomenda")).toBeVisible();
    await page.getByRole("link", { name: "Usar esta atividade no simulador" }).click();
    await expect(page.getByLabel(/Atividade \(CNAE\)/)).toHaveValue("6201-5/01");
  });
});

test.describe("US-09: teclado", () => {
  test("o pular link é o primeiro item e leva ao conteúdo; o formulário envia pelo teclado", async ({ page, isMobile }) => {
    test.skip(isMobile, "fluxo de teclado é validado no desktop");
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeAttached();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Pular para o conteúdo" })).toBeFocused();
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Preencher com um exemplo" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel(/Atividade \(CNAE\)/)).toBeFocused();
    await page.getByRole("button", { name: "Simular regimes" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("heading", { level: 2, name: /^Fique no / })).toBeVisible({ timeout: 20_000 });
  });
});
