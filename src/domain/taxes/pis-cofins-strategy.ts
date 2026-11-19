import { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** PIS/Cofins cumulativos (Lucro Presumido): cobrados até 2026 e extintos pela transição (RN-02). */
export class PisCofinsStrategy implements TaxStrategy {
  readonly code = "PIS_COFINS";

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const transition = await context.rateTables.transitionRatesFor(context.taxYear);
    const revenue = context.company.annualGrossRevenue;
    const source = "Leis 10.637/2002 e 10.833/2003, regime cumulativo; extintos pela LC 214/2025 ⚠️";
    if (transition.pisCofinsExtinct) return new TaxLine(this.code, revenue, TaxRate.zero(), Money.zero(), source);
    const rate = await context.rateTables.cumulativePisCofinsRate(context.taxYear);
    return new TaxLine(this.code, revenue, rate, rate.applyTo(revenue), source);
  }
}
