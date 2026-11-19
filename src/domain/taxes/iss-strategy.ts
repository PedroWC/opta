import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** ISS (serviços), cumulativo: alíquota informada, reduzida pela fração vigente na transição (RN-02). */
export class IssStrategy implements TaxStrategy {
  readonly code = "ISS";

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { icmsIssPercentageInForce } = await context.rateTables.transitionRatesFor(context.taxYear);
    const rate = context.company.icmsIssRate.scale(BigInt(icmsIssPercentageInForce), 100n);
    const revenue = context.company.annualGrossRevenue;
    return new TaxLine(
      this.code,
      revenue,
      rate,
      rate.applyTo(revenue),
      "LC 116/2003 (alíquota informada) reduzida pela transição, LC 214/2025 ⚠️",
    );
  }
}
