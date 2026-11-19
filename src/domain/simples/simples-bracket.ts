import type { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";
import type { DasPartition } from "./das-partition.ts";

/** Uma faixa de um anexo: teto de RBT12, alíquota nominal, parcela a deduzir e partilha (RN-04). */
export class SimplesBracket {
  constructor(
    readonly position: number,
    readonly upTo: Money,
    readonly nominalRate: TaxRate,
    readonly deduction: Money,
    readonly partition: DasPartition,
  ) {}

  /** O teto pertence à própria faixa (RBT12 de 180.000,00 ainda é a 1ª faixa). */
  contains(rbt12: Money): boolean {
    return !rbt12.greaterThan(this.upTo);
  }

  effectiveRate(rbt12: Money): TaxRate {
    return TaxRate.effective(this.nominalRate, rbt12, this.deduction);
  }
}
