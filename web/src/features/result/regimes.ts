import type { Regime } from "../../api/types.ts";

interface RegimeStyle {
  readonly label: string;
  /** Marcador textual, para que o regime nunca dependa só de cor (design system, 2.1). */
  readonly marker: string;
  readonly colorVar: string;
}

const REGIMES: Readonly<Record<Regime, RegimeStyle>> = {
  SIMPLES: { label: "Simples Nacional", marker: "■", colorVar: "var(--color-regime-simples)" },
  SIMPLES_HIBRIDO: { label: "Simples híbrido", marker: "◆", colorVar: "var(--color-regime-hibrido)" },
  LUCRO_PRESUMIDO: { label: "Lucro Presumido", marker: "●", colorVar: "var(--color-regime-presumido)" },
};

/** Único lugar que conhece o mapeamento regime → rótulo, marcador e cor. */
export function regimeStyle(regime: Regime): RegimeStyle {
  return REGIMES[regime];
}

export const FACTOR_LABELS: Readonly<Record<string, string>> = {
  TRIBUTOS_SOBRE_RENDA: "tributos sobre a renda (IRPJ e CSLL)",
  ENCARGOS_SOBRE_FOLHA: "encargos sobre a folha (CPP)",
  TRIBUTOS_SOBRE_CONSUMO: "tributos sobre o consumo (CBS, IBS, ICMS, ISS e PIS/Cofins)",
  NENHUM: "nenhum fator em especial",
};
