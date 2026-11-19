import { describe, expect, test } from "vitest";
import { SimulateRegimesUseCase } from "../../src/application/simulate-regimes-use-case.ts";
import { AnnualResult } from "../../src/domain/regimes/annual-result.ts";
import { TaxRegime } from "../../src/domain/regimes/tax-regime.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import type { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import type { TaxStrategy } from "../../src/domain/taxes/tax-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

class EmptyRegime extends TaxRegime {
  constructor(readonly name: string) {
    super();
  }

  protected taxes(): readonly TaxStrategy[] {
    return [];
  }

  override async simulate(context: CalculationContext): Promise<AnnualResult> {
    return new AnnualResult(this.name, context.taxYear, []);
  }
}

describe("UC-01 / RF-02: simula todos os regimes em todos os anos do horizonte", () => {
  test("RF-02: devolve um resultado por regime e por ano (2 regimes x 8 anos)", async () => {
    const useCase = new SimulateRegimesUseCase(
      [new EmptyRegime("A"), new EmptyRegime("B")],
      new InMemoryTaxRateTableRepository(),
    );
    const company = new CompanyProfile({
      cnae: "4711-3/02",
      state: "MG",
      annualGrossRevenue: Money.fromText("500000"),
      annualPayroll: Money.fromText("60000"),
      b2bPercentage: 20,
      creditablePurchasesPercentage: 40,
    });
    const results = await useCase.execute(company);
    expect(results).toHaveLength(16);
    expect(results[0]?.taxYear.year).toBe(2026);
    expect(results[15]?.taxYear.year).toBe(2033);
  });
});
