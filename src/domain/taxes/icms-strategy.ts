import type { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { NonCumulativeConsumptionTax } from "./non-cumulative-consumption-tax.ts";

/** ICMS (comércio): alíquota informada, reduzida pela fração vigente na transição (RN-02). MVP sem ST. */
export class IcmsStrategy extends NonCumulativeConsumptionTax {
  protected readonly offsetInTestYear = false;
  readonly code = "ICMS";

  protected source(): string {
    return "Legislação estadual (alíquota informada) reduzida pela transição, LC 214/2025 ⚠️";
  }

  protected async rateFor(context: CalculationContext): Promise<TaxRate> {
    const { icmsIssPercentageInForce } = await context.rateTables.transitionRatesFor(context.taxYear);
    return context.company.icmsIssRate.scale(BigInt(icmsIssPercentageInForce), 100n);
  }
}
