import type { CalculationContext } from "./calculation-context.ts";
import type { TaxLine } from "./tax-line.ts";

/** Strategy: cada tributo (DAS, CBS, IBS, PIS/Cofins, ICMS/ISS, IRPJ, CSLL, CPP) é uma implementação. */
export interface TaxStrategy {
  readonly code: string;
  calculate(context: CalculationContext): Promise<TaxLine>;
}
