import type { TaxRateTableRepository, TransitionRates } from "../domain/ports/tax-rate-table-repository.ts";
import { TaxYear } from "../domain/shared/tax-year.ts";

export class YearAssumptions {
  constructor(
    readonly taxYear: TaxYear,
    readonly rates: TransitionRates,
  ) {}
}

export class Assumptions {
  constructor(
    readonly version: string,
    readonly years: readonly YearAssumptions[],
  ) {}
}

/** RF-04: consulta as premissas de transição de um ano ou de todos (DEC-14). */
export class GetAssumptionsUseCase {
  constructor(private readonly rateTables: TaxRateTableRepository) {}

  async execute(taxYear?: TaxYear): Promise<Assumptions> {
    const years = taxYear ? [taxYear] : TaxYear.horizon();
    const items: YearAssumptions[] = [];
    for (const year of years) items.push(new YearAssumptions(year, await this.rateTables.transitionRatesFor(year)));
    return new Assumptions(await this.rateTables.assumptionsVersion(), items);
  }
}
