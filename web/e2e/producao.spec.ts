import { expect, test } from "@playwright/test";
import { simulateExample } from "./helpers";

test.skip(process.env["E2E_PROD"] !== "1", "rodam só no build estático servido pela API (E2E_PROD=1)");

const JS_BUDGET_BYTES = 200 * 1024; // meta do plano do front-end (RNF-11): 200 KB gzip de JS inicial

test.describe("RNF-06 e DEC-15: cabeçalhos e mesma origem", () => {
  test("a página e os assets chegam com CSP, nosniff e política de referência", async ({ request }) => {
    for (const path of ["/", "/premissas", "/v1/health"]) {
      const response = await request.get(path);
      expect(response.status()).toBe(200);
      const headers = response.headers();
      expect(headers["content-security-policy"]).toContain("script-src 'self'");
      expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["referrer-policy"]).toBe("no-referrer");
    }
  });

  test("o fluxo inteiro roda sem violar a CSP nem gerar erro no console, e todas as chamadas vão à mesma origem", async ({ page, baseURL }) => {
    const problems: string[] = [];
    const foreign: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") problems.push(`console: ${message.text()}`);
    });
    page.on("pageerror", (error) => problems.push(`erro: ${error.message}`));
    page.on("request", (request) => {
      if (!request.url().startsWith(baseURL ?? "")) foreign.push(request.url());
    });
    await page.addInitScript(() => {
      document.addEventListener("securitypolicyviolation", (event) => {
        console.error(`CSP: ${event.violatedDirective} ${event.blockedURI}`);
      });
    });

    await simulateExample(page);
    await expect(page.getByRole("img", { name: /Gráfico de linhas/ })).toBeVisible();
    await page.locator("summary", { hasText: "2026" }).click();
    await expect(page.getByRole("tablist", { name: "Regimes de 2026" })).toBeVisible();
    await page.getByRole("link", { name: "Premissas" }).first().click();
    await expect(page.getByRole("table", { name: "Transição da CBS e do IBS por ano" }).or(page.getByRole("region", { name: "2026", exact: true }))).toBeVisible();

    expect(problems).toEqual([]);
    expect(foreign).toEqual([]);
  });

  test("links diretos para rotas da SPA funcionam (fallback para o index.html)", async ({ page }) => {
    for (const [path, heading] of [["/premissas", "Premissas de cálculo"], ["/sobre", "Metodologia"]] as const) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
  });
});

test.describe("RNF-11: orçamento de desempenho", () => {
  test("o JS inicial da tela inicial cabe em 200 KB (gzip) e o gráfico não é baixado até o resultado", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const scripts = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === "script" || entry.name.endsWith(".js"))
        .map((entry) => ({ name: entry.name, bytes: (entry as PerformanceResourceTiming).encodedBodySize })),
    );
    expect(scripts.length).toBeGreaterThan(0);
    expect(scripts.reduce((sum, script) => sum + script.bytes, 0)).toBeLessThan(JS_BUDGET_BYTES);
    expect(scripts.some((script) => /CostChart/.test(script.name))).toBe(false);
  });

  test("LCP abaixo de 2,5 s e CLS abaixo de 0,1 na tela inicial e no resultado", async ({ page }) => {
    await page.addInitScript(() => {
      const vitals = { lcp: 0, cls: 0 };
      (window as unknown as { __vitals: typeof vitals }).__vitals = vitals;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) vitals.lcp = entry.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
          if (!entry.hadRecentInput) vitals.cls += entry.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await simulateExample(page);
    await expect(page.getByRole("img", { name: /Gráfico de linhas/ })).toBeVisible();
    const vitals = await page.evaluate(() => (window as unknown as { __vitals: { lcp: number; cls: number } }).__vitals);
    expect(vitals.lcp).toBeLessThan(2500);
    expect(vitals.cls).toBeLessThan(0.1);
  });
});
