import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** CSLL no Lucro Presumido: 9% da base presumida (RN-07). */
export class CsllStrategy implements TaxStrategy {
  readonly code = "CSLL";

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { company, taxYear, rateTables } = context;
    const presumption = await rateTables.presumptionFor(company.cnae);
    const parameters = await rateTables.lucroPresumidoParametersFor(taxYear);
    const base = presumption.csllBase(company.annualGrossRevenue);
    return new TaxLine(
      this.code,
      base,
      parameters.csllRate,
      parameters.csllRate.applyTo(base),
      "Lei 9.249/1995: CSLL do Lucro Presumido ⚠️",
    );
  }
}
