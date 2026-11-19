import { Money } from "../shared/money.ts";
import type { TaxYear } from "../shared/tax-year.ts";
import type { TaxLine } from "../taxes/tax-line.ts";

export class AnnualResult {
  constructor(
    readonly regime: string,
    readonly taxYear: TaxYear,
    readonly lines: readonly TaxLine[],
  ) {}

  totalBurden(): Money {
    return this.lines.reduce((sum, line) => sum.add(line.amount), Money.zero());
  }
}
