import { InvalidInputError } from "../errors/invalid-input-error.ts";
import { Money } from "../shared/money.ts";
import { TaxRate } from "../shared/tax-rate.ts";
import type { DasComponent } from "./das-component.ts";

export type DasShares = Readonly<Record<DasComponent, Money>>;

/** Partilha do DAS de uma faixa: percentual de cada parcela, somando 100% (RN-04). */
export class DasPartition {
  private static readonly ORDER: readonly DasComponent[] = ["IRPJ", "CSLL", "COFINS", "PIS", "CPP", "ISS"];

  constructor(private readonly shares: Readonly<Record<DasComponent, TaxRate>>) {
    const total = DasPartition.ORDER.reduce((sum, component) => sum.add(shares[component]), TaxRate.zero());
    if (!total.equals(TaxRate.fromPercentage("100"))) {
      throw new InvalidInputError(`A partilha do DAS deve somar 100%, mas soma ${total.toString()}.`);
    }
  }

  /** Divide o DAS pelas parcelas; a diferença de arredondamento fica na maior parcela, para a soma fechar. */
  split(das: Money): DasShares {
    const amounts = {} as Record<DasComponent, Money>;
    let sum = Money.zero();
    let largest: DasComponent = DasPartition.ORDER[0] ?? "IRPJ";
    for (const component of DasPartition.ORDER) {
      amounts[component] = this.shares[component].applyTo(das);
      sum = sum.add(amounts[component]);
      if (this.shares[component].greaterThan(this.shares[largest])) largest = component;
    }
    amounts[largest] = amounts[largest].add(das.subtract(sum));
    return amounts;
  }
}
