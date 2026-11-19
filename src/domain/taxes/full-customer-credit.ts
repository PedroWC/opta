import type { Money } from "../shared/money.ts";
import type { CalculationContext } from "./calculation-context.ts";
import type { CustomerCreditPolicy } from "./customer-credit-policy.ts";

/** Simples híbrido (RN-10): o cliente B2B aproveita o crédito integral, pela alíquota cheia de CBS e IBS. */
export class FullCustomerCredit implements CustomerCreditPolicy {
  async creditFor(context: CalculationContext): Promise<Money> {
    const { company, taxYear, rateTables } = context;
    const { cbs, ibs } = await rateTables.transitionRatesFor(taxYear);
    const businessSales = company.annualGrossRevenue.multiplyByRatio(BigInt(company.b2bPercentage), 100n);
    return cbs.add(ibs).applyTo(businessSales);
  }
}
