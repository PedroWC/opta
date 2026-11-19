import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { contrastRatio } from "./contrast.ts";

const STYLES = join(__dirname);
const read = (file: string): string => readFileSync(join(STYLES, file), "utf8");

/** Lê as declarações `--nome: valor;` de um bloco e resolve `var(--outro)` recursivamente. */
function declarations(css: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const match of css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) map.set(match[1] as string, (match[2] as string).trim());
  return map;
}

function resolve(token: string, tokens: Map<string, string>): string {
  let value = tokens.get(token);
  for (let depth = 0; depth < 5 && value?.startsWith("var("); depth += 1) {
    value = tokens.get(/var\((--[a-z0-9-]+)\)/.exec(value)?.[1] ?? "");
  }
  if (!value) throw new Error(`Token sem valor: ${token}`);
  return value;
}

const primitives = declarations(read("tokens.primitives.css"));
const light = new Map([...primitives, ...declarations(read("tokens.semantic.css"))]);
const dark = new Map([...light, ...declarations(read("themes.css"))]);

type Pair = readonly [foreground: string, background: string, minimum: number, description: string];

/*
 * Mínimos: 4,5:1 para texto normal (WCAG 1.4.3); 3:1 para componentes de interface e anel de foco
 * (1.4.11). Texto principal e dicas têm meta própria de 7:1 (AAA), conforme o design system.
 */
const pairs: readonly Pair[] = [
  ["--color-text", "--color-bg", 7, "texto principal"],
  ["--color-text", "--color-surface", 7, "texto sobre cartão"],
  ["--color-text-muted", "--color-bg", 7, "dica sobre o fundo"],
  ["--color-text-muted", "--color-surface", 7, "dica sobre cartão"],
  ["--color-on-action", "--color-action", 4.5, "texto do botão primário"],
  ["--color-action", "--color-bg", 4.5, "link sobre o fundo"],
  ["--color-action", "--color-surface", 4.5, "link sobre cartão"],
  ["--color-danger", "--color-bg", 4.5, "mensagem de erro"],
  ["--color-success", "--color-bg", 4.5, "confirmação"],
  ["--color-warning-text", "--color-warning-bg", 4.5, "aviso da legislação"],
  ["--color-info-text", "--color-info-bg", 4.5, "faixa de premissas"],
  ["--color-border-strong", "--color-bg", 3, "borda de campo"],
  ["--color-focus", "--color-bg", 3, "anel de foco"],
  ["--color-regime-simples", "--color-bg", 4.5, "série Simples Nacional"],
  ["--color-regime-hibrido", "--color-bg", 4.5, "série Simples híbrido"],
  ["--color-regime-presumido", "--color-bg", 4.5, "série Lucro Presumido"],
];

describe.each([
  ["claro", light],
  ["escuro", dark],
])("RNF-09: contraste dos pares de tokens (tema %s)", (_name, tokens) => {
  test.each(pairs)("RNF-09: %s sobre %s tem pelo menos %d:1 (%s)", (foreground, background, minimum) => {
    const ratio = contrastRatio(resolve(foreground, tokens), resolve(background, tokens));
    expect(ratio, `${foreground} sobre ${background}`).toBeGreaterThanOrEqual(minimum);
  });
});

describe("RNF-09: regras da base de estilo", () => {
  const base = read("base.css");

  test("RNF-09: o foco visível usa o token de foco, com largura e deslocamento", () => {
    expect(base).toMatch(/:focus-visible\s*\{[^}]*var\(--color-focus\)/);
    expect(base).toContain("var(--focus-ring-width)");
    expect(base).toContain("var(--focus-ring-offset)");
  });

  test("RNF-09: movimento reduzido zera animações e transições", () => {
    expect(base).toMatch(/prefers-reduced-motion:\s*reduce[\s\S]*animation-duration:\s*0\.01ms/);
  });

  test("RNF-09: existem os utilitários de acessibilidade (visually-hidden e skip-link)", () => {
    expect(base).toContain(".visually-hidden");
    expect(base).toContain(".skip-link");
  });

  test("RNF-10: o alvo de toque mínimo é de 44 px (2,75 rem)", () => {
    expect(light.get("--target-min")).toBe("2.75rem");
  });

  test("Design system: componentes usam só tokens: base.css não tem cor literal", () => {
    expect(base).not.toMatch(/#[0-9a-fA-F]{3,6}\b/);
    expect(base).not.toMatch(/\brgb\(/);
  });

  test("RNF-09: o tema escuro redefine todas as cores semânticas do tema claro", () => {
    const lightColors = [...declarations(read("tokens.semantic.css")).keys()].filter((k) => k.startsWith("--color-"));
    const darkColors = new Set(declarations(read("themes.css")).keys());
    expect(lightColors.filter((token) => !darkColors.has(token))).toEqual([]);
  });
});

describe("RNF-09: o cálculo de contraste segue a fórmula da WCAG", () => {
  test("preto sobre branco é 21:1 e cores iguais dão 1:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#336699", "#336699")).toBeCloseTo(1, 5);
  });

  test("a ordem dos argumentos não muda o resultado", () => {
    expect(contrastRatio("#0b57d0", "#ffffff")).toBeCloseTo(contrastRatio("#ffffff", "#0b57d0"), 10);
  });
});
