import type { Activity } from "./activity.ts";

/** Uma página de resultados da busca de atividades. */
export class ActivityPage {
  constructor(
    readonly items: readonly Activity[],
    readonly page: number,
    readonly hasNext: boolean,
  ) {}
}
