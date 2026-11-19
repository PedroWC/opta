import type { SimulationResponse } from "../../api/types.ts";

export type AnoResultado = SimulationResponse["anos"][number];
export type LinhaTributo = AnoResultado["regimes"][number]["tributos"][number];
