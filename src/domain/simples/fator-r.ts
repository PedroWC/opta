import { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";

/** Fator R = folha dos 12 meses / RBT12. A partir de 28%, o Anexo V passa ao III (RN-05). */
export class FatorR {
  private static readonly THRESHOLD_PERCENTAGE = 28n;

  private constructor(
    private readonly payroll: Money,
    private readonly rbt12: Money,
  ) {}

  static of(payroll: Money, rbt12: Money): FatorR {
    return new FatorR(payroll, rbt12);
  }

  reachesThreshold(): boolean {
    if (this.rbt12.inCents() <= 0n) return false;
    return this.payroll.inCents() * 100n >= this.rbt12.inCents() * FatorR.THRESHOLD_PERCENTAGE;
  }

  toTaxRate(): TaxRate {
    return TaxRate.fromRatio(this.payroll.inCents(), this.rbt12.inCents());
  }
}
