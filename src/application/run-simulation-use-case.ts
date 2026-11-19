import { RegimeComparison } from "../domain/comparison/regime-comparison.ts";
import { DomainError } from "../domain/errors/domain-error.ts";
import type { TaxRateTableRepository } from "../domain/ports/tax-rate-table-repository.ts";
import type { AnnualResult } from "../domain/regimes/annual-result.ts";
import type { TaxRegime } from "../domain/regimes/tax-regime.ts";
import type { CompanyProfile } from "../domain/shared/company-profile.ts";
import { TaxYear } from "../domain/shared/tax-year.ts";
import { CalculationContext } from "../domain/taxes/calculation-context.ts";
import { SimulationOutcome, UnavailableRegime } from "./simulation-outcome.ts";

/**
 * UC-01: simula os regimes pedidos de 2026 a 2033 e compara. Um regime que não se aplica à empresa vira
 * "indisponível" e não derruba os demais; se nenhum regime pôde ser calculado, o primeiro erro é propagado.
 */
export class RunSimulationUseCase {
  constructor(
    private readonly regimes: readonly TaxRegime[],
    private readonly rateTables: TaxRateTableRepository,
  ) {}

  async execute(company: CompanyProfile, requested?: readonly string[]): Promise<SimulationOutcome> {
    const selected = this.select(requested);
    const results: AnnualResult[] = [];
    const unavailable: UnavailableRegime[] = [];

    for (const regime of selected) {
      try {
        results.push(...(await this.simulateAllYears(regime, company)));
      } catch (error) {
        if (!(error instanceof DomainError)) throw error;
        unavailable.push(new UnavailableRegime(regime.name, error));
      }
    }

    const firstFailure = unavailable[0];
    if (results.length === 0 && firstFailure) throw firstFailure.error;
    return new SimulationOutcome(
      await this.rateTables.assumptionsVersion(),
      results,
      unavailable,
      new RegimeComparison(results),
    );
  }

  private select(requested?: readonly string[]): readonly TaxRegime[] {
    if (!requested) return this.regimes;
    return requested.flatMap((name) => this.regimes.filter((regime) => regime.name === name));
  }

  private async simulateAllYears(regime: TaxRegime, company: CompanyProfile): Promise<AnnualResult[]> {
    const results: AnnualResult[] = [];
    for (const taxYear of TaxYear.horizon()) {
      results.push(await regime.simulate(new CalculationContext(company, taxYear, this.rateTables)));
    }
    return results;
  }
}
