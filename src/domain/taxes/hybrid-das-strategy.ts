import { TaxRate } from "../shared/tax-rate.ts";
import { Money } from "../shared/money.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { DasStrategy } from "./das-strategy.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/**
 * DAS do Simples híbrido (RN-06): o DAS puro sem as parcelas de CBS e IBS, que passam a ser apuradas
 * no regime regular. IRPJ, CSLL, CPP e as parcelas ainda vigentes de PIS/Cofins e ISS permanecem. ⚠️
 */
export class HybridDasStrategy implements TaxStrategy {
  readonly code = "DAS";
  private static readonly MOVED_TO_REGULAR_REGIME: readonly string[] = ["CBS", "IBS"];

  constructor(private readonly pure: DasStrategy = new DasStrategy()) {}

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const full = await this.pure.calculate(context);
    const kept = full.breakdown.filter((part) => !HybridDasStrategy.MOVED_TO_REGULAR_REGIME.includes(part.code));
    const amount = kept.reduce((sum, part) => sum.add(part.amount), Money.zero());
    return new TaxLine(
      this.code,
      full.base,
      TaxRate.fromRatio(amount.inCents(), full.base.inCents()),
      amount,
      `${full.source}, sem CBS/IBS (apurados no regime regular, RN-06)`,
      kept,
    );
  }
}
