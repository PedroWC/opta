import { expect, test } from "@playwright/test";
import { simulateExample } from "./helpers";

// Gera as imagens do README a partir da interface real. Só roda sob demanda: CAPTURAS=1 npx playwright test e2e/capturas.spec.ts
test.skip(process.env["CAPTURAS"] !== "1", "geração de imagens da documentação (sob demanda)");

const OUT = "../docs/img";

test("capturas do simulador, do resultado e das premissas", async ({ page, isMobile }) => {
  const suffix = isMobile ? "celular" : "desktop";
  await page.goto("/");
  await page.getByRole("button", { name: "Preencher com um exemplo" }).click();
  await expect(page.getByText("Desenvolvimento de programas de computador sob encomenda")).toBeVisible();
  await page.screenshot({ path: `${OUT}/simulador-${suffix}.png`, fullPage: !isMobile });

  await page.getByRole("button", { name: "Simular regimes" }).click();
  await expect(page.getByRole("heading", { level: 2, name: /^Fique no / })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("img", { name: /Gráfico de linhas/ })).toBeVisible();
  await page.screenshot({ path: `${OUT}/resultado-${suffix}.png`, fullPage: false });

  if (!isMobile) {
    await page.locator("summary", { hasText: "2026" }).click();
    await expect(page.getByRole("tablist", { name: "Regimes de 2026" })).toBeVisible();
    await page.locator("#memoria").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${OUT}/memoria-de-calculo-${suffix}.png`, fullPage: false });
  }

  await simulateExample(page);
  await page.goto("/premissas");
  await expect(page.getByText("Premissas v2026.1", { exact: true })).toBeVisible();
  if (!isMobile) await page.screenshot({ path: `${OUT}/premissas-${suffix}.png`, fullPage: false });
});
