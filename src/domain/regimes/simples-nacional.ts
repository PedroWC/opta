import { NotImplementedYetError } from "../errors/not-implemented-yet-error.ts";
import type { TaxStrategy } from "../taxes/tax-strategy.ts";
import { TaxRegime } from "./tax-regime.ts";

/** Backlog: "Simples Nacional puro 2026–2033 (Anexos III e V, Fator R)" — RN-04, RN-05. */
export class SimplesNacional extends TaxRegime {
  readonly name: string = "SIMPLES";

  protected taxes(): readonly TaxStrategy[] {
    throw new NotImplementedYetError("DAS do Simples Nacional");
  }
}
