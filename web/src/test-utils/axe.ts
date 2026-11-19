import axe from "axe-core";
import { expect } from "vitest";

/**
 * Roda o axe-core no trecho renderizado. O contraste de cor não é calculável no jsdom (sem layout):
 * ele é verificado nos tokens por `styles/tokens.test.ts`.
 */
export async function expectNoA11yViolations(container: Element): Promise<void> {
  const results = await axe.run(container, { rules: { "color-contrast": { enabled: false } } });
  expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
}
