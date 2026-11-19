import type { Money } from "../shared/money.ts";
import type { BurdenCategory } from "./burden-category.ts";

/** Fator que mais pesou na vantagem do regime recomendado, com código estável para a API (DEC-14). */
export class DecisiveFactor {
  constructor(
    readonly code: BurdenCategory | "NONE",
    /** Quanto a categoria custa a mais no segundo colocado, no horizonte todo. */
    readonly difference: Money,
  ) {}

  label(): string {
    switch (this.code) {
      case "INCOME_TAXES":
        return "tributos sobre a renda (IRPJ e CSLL)";
      case "PAYROLL_CHARGES":
        return "encargos sobre a folha (CPP)";
      case "CONSUMPTION_TAXES":
        return "tributos sobre o consumo (CBS, IBS, ICMS, ISS e PIS/Cofins)";
      default:
        return "nenhum fator (regimes equivalentes)";
    }
  }
}
