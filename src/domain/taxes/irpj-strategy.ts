import { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/** IRPJ no Lucro Presumido: 15% da base presumida mais adicional de 10% acima de R$ 20 mil/mês (RN-07). */
export class IrpjStrategy implements TaxStrategy {
  readonly code = "IRPJ";

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { company, taxYear, rateTables } = context;
    const presumption = await rateTables.presumptionFor(company.cnae);
    const parameters = await rateTables.lucroPresumidoParametersFor(taxYear);
    const base = presumption.irpjBase(company.annualGrossRevenue);

    const basic = parameters.irpjRate.applyTo(base);
    const excess = base.subtract(parameters.surchargeAnnualThreshold());
    const surcharge = excess.greaterThan(Money.zero()) ? parameters.irpjSurchargeRate.applyTo(excess) : Money.zero();
    const amount = basic.add(surcharge);
    const source = "Lei 9.249/1995 e Lei 9.430/1996: IRPJ do Lucro Presumido ⚠️";

    return new TaxLine(this.code, base, TaxRate.fromRatio(amount.inCents(), base.inCents()), amount, source, [
      new TaxLine("IRPJ_BASICO", base, parameters.irpjRate, basic, source),
      new TaxLine("IRPJ_ADICIONAL", excess.greaterThan(Money.zero()) ? excess : Money.zero(), parameters.irpjSurchargeRate, surcharge, source),
    ]);
  }
}
