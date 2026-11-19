import { Money } from "../shared/money.ts";
import type { TaxRate } from "../shared/tax-rate.ts";

/** Parâmetros do Lucro Presumido vigentes no ano (tabela REGIME_PARAMETRO, ADR-0004). */
export class LucroPresumidoParameters {
  constructor(
    readonly irpjRate: TaxRate,
    readonly irpjSurchargeRate: TaxRate,
    readonly irpjSurchargeMonthlyThreshold: Money,
    readonly csllRate: TaxRate,
    readonly cppRate: TaxRate,
  ) {}

  /** O adicional incide sobre a base que excede o limite mensal, aqui anualizado (12 meses). */
  surchargeAnnualThreshold(): Money {
    return this.irpjSurchargeMonthlyThreshold.multiplyByRatio(12n, 1n);
  }
}
