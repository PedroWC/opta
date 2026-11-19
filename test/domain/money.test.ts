import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";

describe("RN-03: dinheiro em centavos com arredondamento determinístico", () => {
  test("RN-03: lê e imprime sem perda de precisão", () => {
    expect(Money.fromText("1234.5").toString()).toBe("1234.50");
    expect(Money.fromText("0.07").toString()).toBe("0.07");
  });

  test("RN-03: 0,10 + 0,20 é exatamente 0,30", () => {
    expect(Money.fromText("0.10").add(Money.fromText("0.20")).toString()).toBe("0.30");
  });

  test("RN-03: rejeita notação científica e mais de duas casas", () => {
    expect(() => Money.fromText("1e3")).toThrow(InvalidInputError);
    expect(() => Money.fromText("1.234")).toThrow(InvalidInputError);
  });

  test("RN-03: 8,8% de 1000,00 é 88,00", () => {
    expect(TaxRate.fromPercentage("8.8").applyTo(Money.fromText("1000")).toString()).toBe("88.00");
  });

  test("RN-03: arredonda meio para cima (0,5% de 1,00 = 0,01)", () => {
    expect(TaxRate.fromPercentage("0.5").applyTo(Money.fromText("1.00")).toString()).toBe("0.01");
  });
});

describe("RN-03: comparações e sinais", () => {
  test("RN-03: compara, subtrai e identifica negativo", () => {
    const one = Money.fromText("1.00");
    const two = Money.fromText("2.00");
    expect(two.greaterThan(one)).toBe(true);
    expect(one.subtract(two).isNegative()).toBe(true);
    expect(one.subtract(two).toString()).toBe("-1.00");
    expect(Money.fromCents(150n).equals(Money.fromText("1.50"))).toBe(true);
    expect(two.inCents()).toBe(200n);
  });

  test("RN-03: escalar a alíquota (IBS de 10% da referência de 17,7% = 1,77%)", () => {
    expect(TaxRate.fromPercentage("17.7").scale(10n, 100n).toString()).toBe("1.7700%");
  });

  test("RN-03: denominador zero é rejeitado", () => {
    expect(() => Money.fromText("1").multiplyByRatio(1n, 0n)).toThrow(InvalidInputError);
  });
});
