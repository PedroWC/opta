import type { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { NonCumulativeConsumptionTax } from "./non-cumulative-consumption-tax.ts";

/** CBS no regime regular (RN-02). Em 2026 vale a alíquota de teste, compensada. */
export class CbsStrategy extends NonCumulativeConsumptionTax {
  protected readonly offsetInTestYear = true;
  readonly code = "CBS";

  protected source(): string {
    return "LC 214/2025: CBS, débito menos crédito (alíquota de referência configurável) ⚠️";
  }

  protected async rateFor(context: CalculationContext): Promise<TaxRate> {
    return (await context.rateTables.transitionRatesFor(context.taxYear)).cbs;
  }
}
