import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

describe("RN-01 e RN-02: horizonte e transição CBS/IBS", () => {
  const repository = new InMemoryTaxRateTableRepository();

  test("RN-02: 2026 é ano de teste e PIS/Cofins ainda vigoram", async () => {
    const rates = await repository.transitionRatesFor(TaxYear.of(2026));
    expect(rates.cbs.toString()).toBe("0.9000%");
    expect(rates.pisCofinsExtinct).toBe(false);
  });

  test("RN-02: 2033 tem IBS pleno e ICMS/ISS extintos", async () => {
    const rates = await repository.transitionRatesFor(TaxYear.of(2033));
    expect(rates.ibs.toString()).toBe("17.7000%");
    expect(rates.icmsIssPercentageInForce).toBe(0);
  });

  test("RN-01: o horizonte tem 8 anos, de 2026 a 2033", () => {
    expect(TaxYear.horizon().map((t) => t.year)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]);
  });

  test("RN-01: ano fora do horizonte é rejeitado", () => {
    expect(() => TaxYear.of(2025)).toThrow(InvalidInputError);
  });
});
