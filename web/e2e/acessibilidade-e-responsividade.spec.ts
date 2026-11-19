import { expect, test } from "@playwright/test";
import { expectNoViolations, simulateExample } from "./helpers";

test.describe("RNF-09: axe em todas as telas, com layout e cores reais", () => {
  for (const [name, path] of [["simulador", "/"], ["premissas", "/premissas"], ["metodologia", "/sobre"], ["não encontrada", "/nao-existe"]] as const) {
    test(`${name} não tem violações WCAG 2.x AA`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (path === "/premissas") await expect(page.getByText("Premissas v2026.1", { exact: true })).toBeVisible();
      await expectNoViolations(page);
    });
  }

  test("resultado (com o gráfico e a memória aberta) não tem violações WCAG 2.x AA", async ({ page }) => {
    await simulateExample(page);
    await page.locator("summary", { hasText: "2026" }).click();
    await expect(page.getByRole("tablist", { name: "Regimes de 2026" })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe("RNF-10: sem rolagem horizontal da página em 320 px", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  const noHorizontalScroll = async (page: import("@playwright/test").Page): Promise<void> => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  };

  for (const [name, path] of [["simulador", "/"], ["premissas", "/premissas"], ["metodologia", "/sobre"]] as const) {
    test(`${name} cabe em 320 px`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await noHorizontalScroll(page);
    });
  }

  test("resultado e memória de cálculo cabem em 320 px", async ({ page }) => {
    await simulateExample(page);
    await page.locator("summary", { hasText: "2026" }).click();
    await noHorizontalScroll(page);
  });
});
