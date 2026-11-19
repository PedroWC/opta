import type { TaxRateTableRepository } from "../ports/tax-rate-table-repository.ts";
import type { CompanyProfile } from "../shared/company-profile.ts";
import type { TaxYear } from "../shared/tax-year.ts";

export class CalculationContext {
  constructor(
    readonly company: CompanyProfile,
    readonly taxYear: TaxYear,
    readonly rateTables: TaxRateTableRepository,
  ) {}
}
