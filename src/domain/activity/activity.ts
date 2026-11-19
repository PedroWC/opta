import type { ActivityKind } from "../presumption/activity-kind.ts";
import type { Presumption } from "../presumption/presumption.ts";
import type { SimplesActivity } from "../simples/simples-activity.ts";

/** Atividade econômica (CNAE) com o que os regimes precisam saber dela (RF-05). */
export class Activity {
  constructor(
    readonly cnae: string,
    readonly description: string,
    readonly kind: ActivityKind,
    /** Regra de anexo do Simples; nula quando a atividade não é de serviço dos Anexos III e V (fora do MVP). */
    readonly simples: SimplesActivity | null,
    readonly presumption: Presumption,
  ) {}

  /** Busca por trecho da descrição ou prefixo do código, sem diferenciar maiúsculas nem acentos. */
  matches(term: string): boolean {
    const wanted = Activity.normalize(term);
    return Activity.normalize(this.description).includes(wanted) || this.cnae.startsWith(term.trim());
  }

  private static normalize(text: string): string {
    return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
  }
}
