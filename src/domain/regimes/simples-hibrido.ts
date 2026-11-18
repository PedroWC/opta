import { NotImplementedYetError } from "../errors/not-implemented-yet-error.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { SimplesNacional } from "./simples-nacional.ts";

/** Simples com CBS/IBS recolhidos por fora do DAS (RN-06). É um Simples ("é um"), por isso herda. */
export class SimplesHibrido extends SimplesNacional {
  override readonly name: string = "SIMPLES_HIBRIDO";

  protected override taxes(): readonly TaxStrategy[] {
    throw new NotImplementedYetError("DAS sem PIS/Cofins/ICMS/ISS e CBS/IBS no regime regular");
  }
}
