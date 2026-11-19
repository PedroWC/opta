import type { AnnualResult } from "../domain/regimes/annual-result.ts";
import type { TaxRegime } from "../domain/regimes/tax-regime.ts";
import type { TaxRateTableRepository } from "../domain/ports/tax-rate-table-repository.ts";
import type { CompanyProfile } from "../domain/shared/company-profile.ts";
import { TaxYear } from "../domain/shared/tax-year.ts";
import { CalculationContext } from "../domain/taxes/calculation-context.ts";

/** UC-01: simular os regimes ano a ano. */
export class SimulateRegimesUseCase {
  constructor(
    private readonly regimes: readonly TaxRegime[],
    private readonly rateTables: TaxRateTableRepository,
  ) {}

  async execute(company: CompanyProfile): Promise<AnnualResult[]> {
    const results: AnnualResult[] = [];
    for (const taxYear of TaxYear.horizon()) {
      const context = new CalculationContext(company, taxYear, this.rateTables);
      for (const regime of this.regimes) results.push(await regime.simulate(context));
    }
    return results;
  }
}
