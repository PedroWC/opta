import { NotImplementedYetError } from "../errors/not-implemented-yet-error.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { TaxRegime } from "./tax-regime.ts";

/** RN-07. */
export class LucroPresumido extends TaxRegime {
  readonly name = "LUCRO_PRESUMIDO";

  protected taxes(): readonly TaxStrategy[] {
    throw new NotImplementedYetError("IRPJ, CSLL, PIS/Cofins, CBS/IBS, ISS/ICMS e CPP");
  }
}
