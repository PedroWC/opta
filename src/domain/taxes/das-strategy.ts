import { FatorR } from "../simples/fator-r.ts";
import type { CalculationContext } from "./calculation-context.ts";
import { DasComposition } from "./das-composition.ts";
import { TaxLine } from "./tax-line.ts";
import type { TaxStrategy } from "./tax-strategy.ts";

/**
 * DAS do Simples Nacional (RN-04, RN-05): escolhe o anexo (Fator R), a faixa pela RBT12, calcula a
 * alíquota efetiva e partilha o valor. No MVP a RBT12 é a receita bruta anual informada.
 */
export class DasStrategy implements TaxStrategy {
  readonly code = "DAS";

  constructor(private readonly composition: DasComposition = new DasComposition()) {}

  async calculate(context: CalculationContext): Promise<TaxLine> {
    const { company, taxYear, rateTables } = context;
    const rbt12 = company.annualGrossRevenue;

    const activity = await rateTables.simplesActivityFor(company.cnae);
    const annex = activity.annexFor(FatorR.of(company.annualPayroll, rbt12));
    const table = await rateTables.simplesAnnexTableFor(annex, taxYear);
    const bracket = table.bracketFor(rbt12);

    const rate = bracket.effectiveRate(rbt12);
    const amount = rate.applyTo(rbt12);
    const transition = await rateTables.transitionRatesFor(taxYear);
    const breakdown = this.composition.breakdown(bracket.partition.split(amount), transition, rbt12);

    return new TaxLine(
      this.code,
      rbt12,
      rate,
      amount,
      `LC 123/2006, Anexo ${annex}, ${bracket.position}ª faixa`,
      breakdown,
    );
  }
}
