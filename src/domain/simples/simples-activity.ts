import type { FatorR } from "./fator-r.ts";
import type { SimplesAnnex } from "./simples-annex.ts";

/** Regra que escolhe o anexo do Simples para uma atividade (CNAE). */
export interface SimplesActivity {
  annexFor(fatorR: FatorR): SimplesAnnex;
  /** Anexo aplicado quando o Fator R não é atingido (ou sempre, nas atividades de anexo fixo). */
  annexWithoutPayrollFactor(): SimplesAnnex;
  usesPayrollFactor(): boolean;
}

/** Atividade sempre tributada em um único anexo. */
export class FixedAnnexActivity implements SimplesActivity {
  constructor(private readonly annex: SimplesAnnex) {}

  annexFor(): SimplesAnnex {
    return this.annex;
  }

  annexWithoutPayrollFactor(): SimplesAnnex {
    return this.annex;
  }

  usesPayrollFactor(): boolean {
    return false;
  }
}

/** Atividade do Anexo V que migra ao Anexo III quando o Fator R atinge 28% (RN-05). */
export class PayrollFactorActivity implements SimplesActivity {
  annexFor(fatorR: FatorR): SimplesAnnex {
    return fatorR.reachesThreshold() ? "III" : "V";
  }

  annexWithoutPayrollFactor(): SimplesAnnex {
    return "V";
  }

  usesPayrollFactor(): boolean {
    return true;
  }
}
