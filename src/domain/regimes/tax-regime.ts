import type { CalculationContext } from "../taxes/calculation-context.ts";
import type { TaxLine } from "../taxes/tax-line.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { AnnualResult } from "./annual-result.ts";

/** Template Method: simulate() é fixo; cada regime só informa quais tributos aplica. */
export abstract class TaxRegime {
  abstract readonly name: string;

  protected abstract taxes(context: CalculationContext): readonly TaxStrategy[];

  async simulate(context: CalculationContext): Promise<AnnualResult> {
    const lines: TaxLine[] = [];
    for (const tax of this.taxes(context)) {
      lines.push(await tax.calculate(context));
    }
    return new AnnualResult(this.name, context.taxYear, lines);
  }
}
