import type { Money } from "../shared/money.ts";
import type { DecisiveFactor } from "./decisive-factor.ts";

/** Recomendação explicada (RF-03): regime, motivo e economia acumulada sobre o segundo colocado. */
export class Recommendation {
  constructor(
    readonly regime: string,
    readonly cumulativeSavings: Money,
    readonly decisiveFactor: DecisiveFactor,
    readonly runnerUp: string | null,
  ) {}

  get reason(): string {
    if (this.runnerUp === null) return "Único regime simulado.";
    return `Menor carga acumulada em 2026–2033 contra ${this.runnerUp}; o que mais pesou: ${this.decisiveFactor.label()}.`;
  }
}
