import { Money } from "../shared/money.ts";
import type { TaxRate } from "../shared/tax-rate.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/**
 * Template Method dos tributos não cumulativos (CBS, IBS, ICMS): débito (receita x alíquota) menos
 * crédito (compras creditáveis x alíquota), nunca negativo. Crédito excedente não é restituído no MVP
 * (⚠️ simplificação). Subclasses informam só o código, a alíquota do ano e a fonte.
 */
export abstract class NonCumulativeConsumptionTax implements TaxStrategy {
  abstract readonly code: string;

  protected abstract source(): string;
  protected abstract rateFor(context: CalculationContext): Promise<TaxRate>;

  /** CBS e IBS de 2026 são alíquotas de teste: apuradas na memória, mas compensadas (carga zero). */
  protected abstract readonly offsetInTestYear: boolean;

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { company } = context;
    const rate = await this.rateFor(context);
    const revenue = company.annualGrossRevenue;
    const purchases = revenue.multiplyByRatio(BigInt(company.creditablePurchasesPercentage), 100n);

    const debit = rate.applyTo(revenue);
    const credit = rate.applyTo(purchases);
    const net = debit.subtract(credit);
    const payable = net.isNegative() || (this.offsetInTestYear && (await this.isTestYear(context))) ? Money.zero() : net;

    const breakdown = [
      new TaxLine(`${this.code}_DEBITO`, revenue, rate, debit, this.source()),
      new TaxLine(`${this.code}_CREDITO`, purchases, rate, credit, this.source()),
    ];
    return new TaxLine(this.code, revenue, rate, payable, this.source(), breakdown);
  }

  private async isTestYear(context: CalculationContext): Promise<boolean> {
    return (await context.rateTables.transitionRatesFor(context.taxYear)).consumptionTestYear;
  }
}
