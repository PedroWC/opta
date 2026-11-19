import type { Money } from "../shared/money.ts";
import type { TaxRate } from "../shared/tax-rate.ts";

/** Uma linha da memória de cálculo (RF-06): auditável e com a fonte legal. */
export class TaxLine {
  constructor(
    readonly code: string,
    readonly base: Money,
    readonly rate: TaxRate,
    readonly amount: Money,
    readonly source: string,
    /** Detalhamento opcional (ex.: partilha do DAS); não entra na soma da carga total. */
    readonly breakdown: readonly TaxLine[] = [],
  ) {}
}
