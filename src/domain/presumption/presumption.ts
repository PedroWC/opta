import type { Money } from "../shared/money.ts";
import type { TaxRate } from "../shared/tax-rate.ts";
import type { ActivityKind } from "./activity-kind.ts";

/** Percentuais de presunção de uma atividade para IRPJ e CSLL (Lucro Presumido, RN-07). */
export class Presumption {
  constructor(
    readonly kind: ActivityKind,
    private readonly irpjRate: TaxRate,
    private readonly csllRate: TaxRate,
  ) {}

  irpjBase(revenue: Money): Money {
    return this.irpjRate.applyTo(revenue);
  }

  csllBase(revenue: Money): Money {
    return this.csllRate.applyTo(revenue);
  }
}
