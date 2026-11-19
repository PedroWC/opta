import type { Regime, SimulationResponse } from "../../api/types.ts";

export type ChartPoint = { ano: number } & Partial<Record<Regime, number>>;

/**
 * Prepara os pontos do gráfico. É o único ponto em que o dinheiro (texto decimal) vira `number`, só para desenhar:
 * a precisão exata fica na tabela, que usa os textos do contrato (plano do front, princípio 2).
 */
export function chartData(simulation: SimulationResponse): ChartPoint[] {
  return simulation.anos.map((year) => {
    const point: ChartPoint = { ano: year.ano };
    for (const item of year.regimes) point[item.regime] = Number(item.carga_total);
    return point;
  });
}

export function regimesOf(simulation: SimulationResponse): Regime[] {
  return simulation.anos[0]?.regimes.map((item) => item.regime) ?? [];
}
