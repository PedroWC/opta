import type { Money } from "../shared/money.ts";
import type { CalculationContext } from "./calculation-context.ts";

/** Crédito de CBS/IBS que o cliente PJ (B2B) aproveita ao comprar da empresa simulada (RN-10). */
export interface CustomerCreditPolicy {
  creditFor(context: CalculationContext): Promise<Money>;
}
