import { InvalidInputError } from "../errors/invalid-input-error.ts";

/** Ano de apuração dentro do horizonte da transição (RN-01). */
export class TaxYear {
  static readonly FIRST = 2026;
  static readonly LAST = 2033;

  private constructor(readonly year: number) {}

  static of(year: number): TaxYear {
    if (!Number.isInteger(year) || year < TaxYear.FIRST || year > TaxYear.LAST) {
      throw new InvalidInputError(`Ano fora do horizonte ${TaxYear.FIRST}–${TaxYear.LAST}: ${year}`);
    }
    return new TaxYear(year);
  }

  static horizon(): TaxYear[] {
    const years: TaxYear[] = [];
    for (let y = TaxYear.FIRST; y <= TaxYear.LAST; y++) years.push(new TaxYear(y));
    return years;
  }
}
