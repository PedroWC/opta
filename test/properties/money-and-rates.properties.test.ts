import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";

const cents = fc.bigInt({ min: -10_000_000_000n, max: 10_000_000_000n });
const nonNegativeCents = fc.bigInt({ min: 0n, max: 10_000_000_000n });
const percentageText = fc
  .tuple(fc.integer({ min: 0, max: 999 }), fc.integer({ min: 0, max: 9999 }))
  .map(([whole, fraction]) => `${whole}.${String(fraction).padStart(4, "0")}`);

describe("RN-03 e RNF-02: propriedades de Money", () => {
  test("RN-03: texto -> Money -> texto é a identidade para qualquer valor em centavos", () => {
    fc.assert(
      fc.property(cents, (value) => {
        const money = Money.fromCents(value);
        expect(Money.fromText(money.toString()).equals(money)).toBe(true);
      }),
    );
  });

  test("RN-03: somar e subtrair o mesmo valor volta ao original", () => {
    fc.assert(
      fc.property(cents, cents, (a, b) => {
        const x = Money.fromCents(a);
        const y = Money.fromCents(b);
        expect(x.add(y).subtract(y).equals(x)).toBe(true);
        expect(x.add(y).equals(y.add(x))).toBe(true);
      }),
    );
  });

  test("RN-03: multiplicar por n/n é a identidade", () => {
    fc.assert(
      fc.property(cents, fc.bigInt({ min: 1n, max: 1_000_000n }), (value, n) => {
        expect(Money.fromCents(value).multiplyByRatio(n, n).inCents()).toBe(value);
      }),
    );
  });

  test("RN-03: o arredondamento erra no máximo meio centavo em relação ao valor exato", () => {
    fc.assert(
      fc.property(cents, fc.bigInt({ min: 0n, max: 2_000_000n }), fc.bigInt({ min: 1n, max: 2_000_000n }), (value, num, den) => {
        const result = Money.fromCents(value).multiplyByRatio(num, den).inCents();
        const exactTimesDen = value * num;
        const difference = exactTimesDen - result * den;
        expect((difference < 0n ? -difference : difference) * 2n).toBeLessThanOrEqual(den);
      }),
    );
  });
});

describe("RN-03: propriedades de TaxRate", () => {
  test("RN-03: percentual em texto -> alíquota -> texto é a identidade (4 casas)", () => {
    fc.assert(
      fc.property(percentageText, (text) => {
        expect(TaxRate.fromPercentage(text).toPercentageText()).toBe(text);
      }),
    );
  });

  test("RN-03: aplicar a alíquota é monotônico na base e zero na base zero", () => {
    fc.assert(
      fc.property(percentageText, nonNegativeCents, nonNegativeCents, (text, a, b) => {
        const rate = TaxRate.fromPercentage(text);
        const [low, high] = a <= b ? [a, b] : [b, a];
        expect(rate.applyTo(Money.fromCents(low)).inCents()).toBeLessThanOrEqual(rate.applyTo(Money.fromCents(high)).inCents());
        expect(rate.applyTo(Money.zero()).equals(Money.zero())).toBe(true);
      }),
    );
  });

  test("RN-03: a razão entre dois valores nunca passa de 100% quando o numerador não excede o denominador", () => {
    fc.assert(
      fc.property(nonNegativeCents, nonNegativeCents, (a, b) => {
        const [part, whole] = a <= b ? [a, b] : [b, a];
        if (whole === 0n) return;
        expect(TaxRate.fromRatio(part, whole).greaterThan(TaxRate.fromPercentage("100"))).toBe(false);
      }),
    );
  });
});
