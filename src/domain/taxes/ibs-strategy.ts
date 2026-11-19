import type { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { NonCumulativeConsumptionTax } from "./non-cumulative-consumption-tax.ts";

/** IBS no regime regular: 0,1% até 2028, 10/20/30/40% da referência de 2029 a 2032 e pleno em 2033 (RN-02). */
export class IbsStrategy extends NonCumulativeConsumptionTax {
  protected readonly offsetInTestYear = true;
  readonly code = "IBS";

  protected source(): string {
    return "LC 214/2025: IBS, débito menos crédito, transição 2029–2033 ⚠️";
  }

  protected async rateFor(context: CalculationContext): Promise<TaxRate> {
    return (await context.rateTables.transitionRatesFor(context.taxYear)).ibs;
  }
}
