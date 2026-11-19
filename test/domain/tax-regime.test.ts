import { describe, expect, test } from "vitest";
import { AnnualResult } from "../../src/domain/regimes/annual-result.ts";
import { TaxRegime } from "../../src/domain/regimes/tax-regime.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { SimplesHibrido } from "../../src/domain/regimes/simples-hibrido.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { TaxLine } from "../../src/domain/taxes/tax-line.ts";
import type { TaxStrategy } from "../../src/domain/taxes/tax-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

class FixedTax implements TaxStrategy {
  constructor(readonly code: string, private readonly amount: string) {}

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const base = context.company.annualGrossRevenue;
    return new TaxLine(this.code, base, TaxRate.zero(), Money.fromText(this.amount), "fonte de teste");
  }
}

class FakeRegime extends TaxRegime {
  readonly name = "FAKE";

  protected taxes(): readonly TaxStrategy[] {
    return [new FixedTax("A", "10.00"), new FixedTax("B", "5.25")];
  }
}

const company = new CompanyProfile({
  cnae: "6201-5/01",
  state: "SP",
  annualGrossRevenue: Money.fromText("100000"),
  annualPayroll: Money.fromText("30000"),
  b2bPercentage: 50,
  creditablePurchasesPercentage: 10,
});

const contextFor = (year: number): CalculationContext =>
  new CalculationContext(company, TaxYear.of(year), new InMemoryTaxRateTableRepository());

describe("RF-06 e RN-03: regime simula somando as linhas da memória de cálculo", () => {
  test("RF-06: cada tributo vira uma linha com código e fonte", async () => {
    const result = await new FakeRegime().simulate(contextFor(2027));
    expect(result.lines.map((l) => l.code)).toEqual(["A", "B"]);
    expect(result.lines.every((l) => l.source.length > 0)).toBe(true);
  });

  test("RN-03: a carga total é a soma exata das linhas", async () => {
    const result = await new FakeRegime().simulate(contextFor(2027));
    expect(result.totalBurden().toString()).toBe("15.25");
  });

  test("RF-02: a carga total de um resultado sem linhas é zero", () => {
    expect(new AnnualResult("X", TaxYear.of(2026), []).totalBurden().equals(Money.zero())).toBe(true);
  });
});

describe("RN-06: o Simples híbrido é um Simples", () => {
  test("RN-06: SimplesHibrido herda de SimplesNacional e tem nome próprio", () => {
    const hybrid = new SimplesHibrido();
    expect(hybrid).toBeInstanceOf(SimplesNacional);
    expect(hybrid.name).toBe("SIMPLES_HIBRIDO");
  });
});
