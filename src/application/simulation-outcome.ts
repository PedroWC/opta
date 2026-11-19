import type { RegimeComparison } from "../domain/comparison/regime-comparison.ts";
import type { DomainError } from "../domain/errors/domain-error.ts";
import type { AnnualResult } from "../domain/regimes/annual-result.ts";

/** Regime que não se aplica à empresa (ex.: receita acima do teto do Simples), com o motivo estável. */
export class UnavailableRegime {
  constructor(
    readonly regime: string,
    readonly error: DomainError,
  ) {}
}

/** Resultado da simulação: o que foi calculado, o que não se aplica e a comparação. */
export class SimulationOutcome {
  constructor(
    readonly assumptionsVersion: string,
    readonly results: readonly AnnualResult[],
    readonly unavailable: readonly UnavailableRegime[],
    readonly comparison: RegimeComparison,
  ) {}
}
