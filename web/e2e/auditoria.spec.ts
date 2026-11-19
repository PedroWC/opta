import { expect, test, type Page } from "@playwright/test";
import { injectCss, simulateExample } from "./helpers";

const SCREENS: ReadonlyArray<readonly [string, string]> = [
  ["simulador", "/"],
  ["premissas", "/premissas"],
  ["metodologia", "/sobre"],
];

async function openResult(page: Page): Promise<void> {
  await simulateExample(page);
  await page.locator("summary", { hasText: "2026" }).click();
  await expect(page.getByRole("tablist", { name: "Regimes de 2026" })).toBeVisible();
}

/** Elementos interativos visíveis, com tamanho e foco. */
const interactiveSizes = (page: Page) =>
  page.evaluate(() => {
    const selector = "a[href], button, input:not([type=hidden]), select, summary, [role=tab], [role=option], [tabindex]:not([tabindex='-1'])";
    return [...document.querySelectorAll<HTMLElement>(selector)]
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        // WCAG 2.5.8 isenta links "inline" (dentro de uma frase); os do rodapé e da navegação são auditados.
        const inlineInSentence = el.tagName === "A" && !el.closest("footer, nav") && (el.closest("p, li")?.textContent ?? "").trim() !== (el.textContent ?? "").trim();
        return style.visibility !== "hidden" && style.display !== "none" && rect.width > 0 && rect.height > 0 && !el.closest(".visually-hidden") && !el.classList.contains("skip-link") && !inlineInSentence;
      })
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return { tag: el.tagName.toLowerCase(), text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 30), width: Math.round(rect.width), height: Math.round(rect.height), type: el.getAttribute("type") };
      });
  });

test.describe("WCAG 2.5.8: tamanho mínimo dos alvos (24 px) e meta do projeto (44 px)", () => {
  for (const [name, path] of SCREENS) {
    test(`${name}: todo controle tem pelo menos 24 × 24 px; botões, links de navegação e abas têm 44 px de altura`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const sizes = await interactiveSizes(page);
      const tooSmall = sizes.filter((item) => item.type !== "checkbox" && item.type !== "radio" && (item.width < 24 || item.height < 24));
      expect(tooSmall.map((item) => `${item.tag} "${item.text}" ${item.width}×${item.height}`)).toEqual([]);
      const buttonsAndTabs = sizes.filter((item) => item.tag === "button" || item.tag === "select" || (item.tag === "input" && item.type !== "checkbox" && item.type !== "radio" && item.type !== "range"));
      expect(buttonsAndTabs.filter((item) => item.height < 44).map((item) => `${item.tag} "${item.text}" ${item.height}`)).toEqual([]);
    });
  }

  test("resultado com a memória aberta: alvos de 24 px no celular", async ({ page, isMobile }) => {
    test.skip(!isMobile, "alvos de toque são auditados no celular");
    await openResult(page);
    const sizes = await interactiveSizes(page);
    expect(sizes.filter((item) => item.type !== "checkbox" && item.type !== "radio" && (item.width < 24 || item.height < 24)).map((item) => `${item.tag} "${item.text}" ${item.width}×${item.height}`)).toEqual([]);
  });
});

test.describe("WCAG 2.4.7 e 2.4.11: foco visível e não obscurecido", () => {
  for (const [name, path] of SCREENS) {
    test(`${name}: cada elemento recebe um indicador de foco visível ao navegar por teclado`, async ({ page, isMobile }) => {
      test.skip(isMobile, "navegação por teclado é auditada no desktop");
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const failures: string[] = [];
      for (let step = 0; step < 40; step += 1) {
        await page.keyboard.press("Tab");
        const state = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return null;
          const style = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) >= 2;
          return { label: `${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 25)}"`, outline, inViewport: rect.top >= -1 && rect.bottom <= window.innerHeight + 1 };
        });
        if (state === null) break;
        if (!state.outline) failures.push(`${state.label} sem contorno de foco`);
        if (!state.inViewport) failures.push(`${state.label} fora da área visível ao receber foco`);
      }
      expect(failures).toEqual([]);
    });
  }
});

test.describe("WCAG 1.4.12: espaçamento de texto e 1.4.4: zoom", () => {
  const spacing = "*{line-height:1.5 !important;letter-spacing:.12em !important;word-spacing:.16em !important} p{margin-bottom:2em !important}";

  for (const [name, path] of SCREENS) {
    test(`${name}: com o espaçamento de texto da WCAG o conteúdo não é cortado nem estoura a tela`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await injectCss(page, spacing);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      const clipped = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>("h1,h2,h3,p,label,legend,button,a")]
          .filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible")
          .map((el) => (el.textContent ?? "").trim().slice(0, 30)),
      );
      expect(clipped).toEqual([]);
    });
  }

  test("o resultado continua utilizável com zoom de 200% (viewport de 640 px) e de 400% (320 px)", async ({ page, isMobile }) => {
    test.skip(isMobile, "zoom é simulado com a largura da janela no desktop");
    for (const width of [640, 320]) {
      await page.setViewportSize({ width, height: 800 });
      await openResult(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
      await expect(page.getByRole("heading", { level: 2, name: /^Fique no / })).toBeVisible();
    }
  });
});

test.describe("Leitor de tela: estrutura (árvore de acessibilidade)", () => {
  test("a página do simulador tem a ordem e os nomes esperados", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("body")).toMatchAriaSnapshot(`
      - link "Pular para o conteúdo"
      - banner:
        - navigation "Principal":
          - list:
            - listitem:
              - link "Simulador"
            - listitem:
              - link "Premissas"
            - listitem:
              - link "Metodologia"
      - main:
        - heading "Qual regime compensa na Reforma Tributária?" [level=1]
        - button "Preencher com um exemplo"
      - contentinfo:
        - paragraph: /Simulador educacional/
    `);
  });

  test("os campos têm nome acessível e agrupamento por seção", async ({ page }) => {
    await page.goto("/");
    for (const group of ["1. Sua empresa", /2\. Seus números/, "3. Para quem você vende", "4. O que comparar"]) {
      await expect(page.getByRole("group", { name: group })).toBeVisible();
    }
    for (const name of [/Atividade \(CNAE\)/, /^UF/, /Alíquota de ISS ou ICMS/, /Receita bruta anual/, /Folha de pagamento anual/, /Clientes empresas \(B2B\)/, /Compras que geram crédito/]) {
      await expect(page.getByLabel(name).first()).toBeVisible();
    }
  });

  test("a hierarquia de títulos do resultado não pula níveis", async ({ page }) => {
    await openResult(page);
    const levels = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((heading) => Number(heading.tagName.slice(1))));
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) expect((levels[index] ?? 0) - (levels[index - 1] ?? 0)).toBeLessThanOrEqual(1);
  });

  test("o idioma da página é português do Brasil e cada tela tem título próprio", async ({ page }) => {
    for (const [, path] of SCREENS) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
      expect(await page.title()).toMatch(/ — Opta$/);
    }
  });
});

test.describe("Impressão e movimento", () => {
  test("ao imprimir, a navegação e os botões somem e a memória de cálculo aparece expandida", async ({ page, isMobile }) => {
    test.skip(isMobile, "impressão é auditada no desktop");
    await simulateExample(page);
    await page.emulateMedia({ media: "print" });
    await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeHidden();
    await expect(page.getByRole("button", { name: "Ver como calculamos" })).toBeHidden();
    await expect(page.locator("details[open] summary", { hasText: "2026" })).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Regimes de 2026" })).toBeVisible();
  });

  test("com movimento reduzido nenhuma animação ou transição passa de 1 ms", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const durations = await page.evaluate(() =>
      [...document.querySelectorAll("*")].map((el) => getComputedStyle(el).transitionDuration).filter((value) => value !== "0s" && Number.parseFloat(value) > 0.001),
    );
    expect(durations).toEqual([]);
  });
});
