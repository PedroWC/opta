import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Axe de verdade, com layout e cores: aqui o contraste é conferido (no jsdom ele não é calculável). */
export async function expectNoViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length})`)).toEqual([]);
}

/**
 * Injeta CSS de teste pela API de folhas de estilo construídas: diferente de `addStyleTag`, não é bloqueada pela
 * CSP do build de produção (`style-src 'self'`), e a CSP continua ativa no resto da página.
 */
export async function injectCss(page: Page, css: string): Promise<void> {
  await page.evaluate((text) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(text);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  }, css);
}

/** Abre o simulador, preenche o exemplo da US-01 e envia; termina na tela de resultado já carregada. */
export async function simulateExample(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Preencher com um exemplo" }).click();
  await page.getByRole("button", { name: "Simular regimes" }).click();
  await expect(page.getByRole("heading", { level: 2, name: /^Fique no / })).toBeVisible({ timeout: 20_000 });
}
