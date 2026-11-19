import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** CPP patronal sobre a folha (20%). ⚠️ MVP sem RAT e contribuições de terceiros. */
export class CppStrategy implements TaxStrategy {
  readonly code = "CPP";

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { company, taxYear, rateTables } = context;
    const { cppRate } = await rateTables.lucroPresumidoParametersFor(taxYear);
    return new TaxLine(
      this.code,
      company.annualPayroll,
      cppRate,
      cppRate.applyTo(company.annualPayroll),
      "Lei 8.212/1991, art. 22: contribuição patronal (sem RAT e terceiros) ⚠️",
    );
  }
}
