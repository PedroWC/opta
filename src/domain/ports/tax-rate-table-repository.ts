import type { SimplesActivity } from "../simples/simples-activity.ts";
import type { SimplesAnnex } from "../simples/simples-annex.ts";
import type { SimplesAnnexTable } from "../simples/simples-annex-table.ts";
import type { TaxRate } from "../shared/tax-rate.ts";
import type { TaxYear } from "../shared/tax-year.ts";

export interface TransitionRates {
  readonly cbs: TaxRate;
  readonly ibs: TaxRate;
  /** Fração do ICMS/ISS ainda vigente no ano, em % (2029 => 90). */
  readonly icmsIssPercentageInForce: number;
  readonly pisCofinsExtinct: boolean;
}

/** Porta do domínio, implementada na infraestrutura (Oracle, SQLite), sempre por vigência (RNF-05). */
export interface TaxRateTableRepository {
  transitionRatesFor(taxYear: TaxYear): Promise<TransitionRates>;
  /** Tabela de faixas e partilha de um anexo do Simples, vigente no ano (RN-04). */
  simplesAnnexTableFor(annex: SimplesAnnex, taxYear: TaxYear): Promise<SimplesAnnexTable>;
  /** Regra de anexo da atividade (CNAE); lança UnsupportedActivityError fora do escopo do MVP. */
  simplesActivityFor(cnae: string): Promise<SimplesActivity>;
}
