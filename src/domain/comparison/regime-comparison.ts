import { InvalidInputError } from "../errors/invalid-input-error.ts";
import type { AnnualResult } from "../regimes/annual-result.ts";
import { Money } from "../shared/money.ts";
import type { TaxYear } from "../shared/tax-year.ts";
import type { BurdenCategory } from "./burden-category.ts";
import { BurdenClassifier } from "./burden-classifier.ts";
import { DecisiveFactor } from "./decisive-factor.ts";
import { Recommendation } from "./recommendation.ts";

/** Compara regimes ano a ano e no acumulado (RN-08). Empates ficam com o primeiro regime informado. */
export class RegimeComparison {
  private readonly regimeNames: string[] = [];

  constructor(
    private readonly results: readonly AnnualResult[],
    private readonly classifier: BurdenClassifier = new BurdenClassifier(),
  ) {
    if (results.length === 0) throw new InvalidInputError("Não há resultados para comparar.");
    for (const result of results) {
      if (!this.regimeNames.includes(result.regime)) this.regimeNames.push(result.regime);
    }
  }

  regimes(): readonly string[] {
    return this.regimeNames;
  }

  bestInYear(taxYear: TaxYear): string {
    const ofYear = this.results.filter((result) => result.taxYear.year === taxYear.year);
    if (ofYear.length === 0) throw new InvalidInputError(`Não há resultados para ${taxYear.year}.`);
    return this.lowest(ofYear.map((result) => [result.regime, result.totalBurden()]));
  }

  cumulativeBurden(regime: string): Money {
    const own = this.resultsOf(regime);
    return own.reduce((sum, result) => sum.add(result.totalBurden()), Money.zero());
  }

  recommendation(): Recommendation {
    const ranking = [...this.regimeNames].sort(
      (a, b) => this.compareCumulative(a, b) || this.regimeNames.indexOf(a) - this.regimeNames.indexOf(b),
    );
    const [winner, runnerUp] = ranking;
    if (winner === undefined) throw new InvalidInputError("Não há regimes para comparar.");
    if (runnerUp === undefined) return new Recommendation(winner, Money.zero(), new DecisiveFactor("NONE", Money.zero()), null);
    const savings = this.cumulativeBurden(runnerUp).subtract(this.cumulativeBurden(winner));
    // Sem vantagem (empate), não há fator a destacar.
    const factor = savings.greaterThan(Money.zero()) ? this.decisiveFactor(winner, runnerUp) : new DecisiveFactor("NONE", Money.zero());
    return new Recommendation(winner, savings, factor, runnerUp);
  }

  private decisiveFactor(winner: string, runnerUp: string): DecisiveFactor {
    const winnerTotals = this.classifier.totals(this.resultsOf(winner));
    const runnerUpTotals = this.classifier.totals(this.resultsOf(runnerUp));
    let best: DecisiveFactor = new DecisiveFactor("NONE", Money.zero());
    for (const category of Object.keys(winnerTotals) as BurdenCategory[]) {
      const difference = runnerUpTotals[category].subtract(winnerTotals[category]);
      if (difference.greaterThan(best.difference)) best = new DecisiveFactor(category, difference);
    }
    return best;
  }

  private compareCumulative(a: string, b: string): number {
    const difference = this.cumulativeBurden(a).subtract(this.cumulativeBurden(b));
    if (difference.isNegative()) return -1;
    return difference.greaterThan(Money.zero()) ? 1 : 0;
  }

  private resultsOf(regime: string): AnnualResult[] {
    const own = this.results.filter((result) => result.regime === regime);
    if (own.length === 0) throw new InvalidInputError(`Regime desconhecido: ${regime}.`);
    return own;
  }

  private lowest(candidates: ReadonlyArray<readonly [string, Money]>): string {
    let best = candidates[0];
    for (const candidate of candidates) {
      if (best && best[1].greaterThan(candidate[1])) best = candidate;
    }
    return (best ?? candidates[0])?.[0] ?? "";
  }
}
