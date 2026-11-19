import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { DasStrategy } from "../taxes/das-strategy.ts";
import { TaxRegime } from "./tax-regime.ts";

/** Simples Nacional puro: um único DAS, com partilha na memória de cálculo (RN-04, RN-05). */
export class SimplesNacional extends TaxRegime {
  readonly name: string = "SIMPLES";

  protected taxes(): readonly TaxStrategy[] {
    return [new DasStrategy()];
  }
}
