import type { FatorR } from "./fator-r.ts";
import type { SimplesAnnex } from "./simples-annex.ts";

/** Regra que escolhe o anexo do Simples para uma atividade (CNAE). */
export interface SimplesActivity {
  annexFor(fatorR: FatorR): SimplesAnnex;
}

/** Atividade sempre tributada em um único anexo. */
export class FixedAnnexActivity implements SimplesActivity {
  constructor(private readonly annex: SimplesAnnex) {}

  annexFor(): SimplesAnnex {
    return this.annex;
  }
}

/** Atividade do Anexo V que migra ao Anexo III quando o Fator R atinge 28% (RN-05). */
export class PayrollFactorActivity implements SimplesActivity {
  annexFor(fatorR: FatorR): SimplesAnnex {
    return fatorR.reachesThreshold() ? "III" : "V";
  }
}
