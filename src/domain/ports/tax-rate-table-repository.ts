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
}
