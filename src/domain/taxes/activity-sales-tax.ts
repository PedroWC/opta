import type { CalculationContext } from "./calculation-context.ts";
import type { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** Escolhe ISS (serviço) ou ICMS (comércio) conforme a natureza da atividade do CNAE. */
export class ActivitySalesTax implements TaxStrategy {
  readonly code = "ICMS_ISS";

  constructor(
    private readonly serviceTax: TaxStrategy,
    private readonly commerceTax: TaxStrategy,
  ) {}

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const presumption = await context.rateTables.presumptionFor(context.company.cnae);
    const tax = presumption.kind === "SERVICE" ? this.serviceTax : this.commerceTax;
    return tax.calculate(context);
  }
}
