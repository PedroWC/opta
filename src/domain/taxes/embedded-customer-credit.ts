import { Money } from "../shared/money.ts";
import type { CalculationContext } from "./calculation-context.ts";
import type { CustomerCreditPolicy } from "./customer-credit-policy.ts";
import { DasStrategy } from "./das-strategy.ts";

/** Simples puro (RN-10): o crédito do cliente B2B se limita ao CBS/IBS embutido no DAS. ⚠️ LC 214/2025. */
export class EmbeddedCustomerCredit implements CustomerCreditPolicy {
  constructor(private readonly das: DasStrategy = new DasStrategy()) {}

  async creditFor(context: CalculationContext): Promise<Money> {
    const line = await this.das.calculate(context);
    const embedded = line.breakdown
      .filter((part) => part.code === "CBS" || part.code === "IBS")
      .reduce((sum, part) => sum.add(part.amount), Money.zero());
    return embedded.multiplyByRatio(BigInt(context.company.b2bPercentage), 100n);
  }
}
