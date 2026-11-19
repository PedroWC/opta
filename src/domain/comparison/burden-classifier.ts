import { Money } from "../shared/money.ts";
import type { AnnualResult } from "../regimes/annual-result.ts";
import type { BurdenCategory } from "./burden-category.ts";

/** Soma a carga de um regime por categoria de tributo, abrindo a partilha do DAS. */
export class BurdenClassifier {
  private static readonly CATEGORY_BY_CODE: Readonly<Record<string, BurdenCategory>> = {
    IRPJ: "INCOME_TAXES",
    CSLL: "INCOME_TAXES",
    CPP: "PAYROLL_CHARGES",
    PIS_COFINS: "CONSUMPTION_TAXES",
    CBS: "CONSUMPTION_TAXES",
    IBS: "CONSUMPTION_TAXES",
    ICMS: "CONSUMPTION_TAXES",
    ISS: "CONSUMPTION_TAXES",
  };

  totals(results: readonly AnnualResult[]): Record<BurdenCategory, Money> {
    const totals: Record<BurdenCategory, Money> = {
      INCOME_TAXES: Money.zero(),
      PAYROLL_CHARGES: Money.zero(),
      CONSUMPTION_TAXES: Money.zero(),
    };
    for (const result of results) {
      for (const line of result.lines) {
        // O DAS é uma linha única; sua partilha (IRPJ, CSLL, CPP, ...) é que carrega as categorias.
        const parts = line.code === "DAS" ? line.breakdown : [line];
        for (const part of parts) {
          const category = BurdenClassifier.CATEGORY_BY_CODE[part.code];
          if (category) totals[category] = totals[category].add(part.amount);
        }
      }
    }
    return totals;
  }
}
