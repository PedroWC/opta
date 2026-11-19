import type { LucroPresumidoParameters } from "../presumption/lucro-presumido-parameters.ts";
import type { Presumption } from "../presumption/presumption.ts";
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
  /** Ano de teste da CBS/IBS (2026): valores calculados, mas compensados com PIS/Cofins. */
  readonly consumptionTestYear: boolean;
}

/** Porta do domínio, implementada na infraestrutura (Oracle, SQLite), sempre por vigência (RNF-05). */
export interface TaxRateTableRepository {
  transitionRatesFor(taxYear: TaxYear): Promise<TransitionRates>;
  /** Tabela de faixas e partilha de um anexo do Simples, vigente no ano (RN-04). */
  simplesAnnexTableFor(annex: SimplesAnnex, taxYear: TaxYear): Promise<SimplesAnnexTable>;
  /** Regra de anexo da atividade (CNAE); lança UnsupportedActivityError fora do escopo do MVP. */
  /** Alíquota combinada de PIS e Cofins no regime cumulativo (Lucro Presumido), vigente no ano. */
  cumulativePisCofinsRate(taxYear: TaxYear): Promise<TaxRate>;
  /** Presunção de IRPJ/CSLL e natureza da atividade (CNAE); lança UnsupportedActivityError fora do escopo. */
  presumptionFor(cnae: string): Promise<Presumption>;
  /** Parâmetros do Lucro Presumido vigentes no ano. */
  lucroPresumidoParametersFor(taxYear: TaxYear): Promise<LucroPresumidoParameters>;
  simplesActivityFor(cnae: string): Promise<SimplesActivity>;
}
