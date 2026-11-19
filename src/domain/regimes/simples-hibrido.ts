import { CbsStrategy } from "../taxes/cbs-strategy.ts";
import { HybridDasStrategy } from "../taxes/hybrid-das-strategy.ts";
import { IbsStrategy } from "../taxes/ibs-strategy.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { SimplesNacional } from "./simples-nacional.ts";

/** Simples com CBS/IBS recolhidos por fora do DAS (RN-06). É um Simples ("é um"), por isso herda. */
export class SimplesHibrido extends SimplesNacional {
  override readonly name: string = "SIMPLES_HIBRIDO";

  protected override taxes(): readonly TaxStrategy[] {
    return [new HybridDasStrategy(), new CbsStrategy(), new IbsStrategy()];
  }
}
