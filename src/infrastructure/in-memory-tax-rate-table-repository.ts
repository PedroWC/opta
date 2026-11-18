import { EffectivePeriodNotFoundError } from "../domain/errors/effective-period-not-found-error.ts";
import type { TaxRateTableRepository, TransitionRates } from "../domain/ports/tax-rate-table-repository.ts";
import { TaxRate } from "../domain/shared/tax-rate.ts";
import type { TaxYear } from "../domain/shared/tax-year.ts";

interface YearRule {
  readonly cbsIsTestRate: boolean;
  /** % da alíquota de referência do IBS aplicada no ano (0 = apenas a alíquota-teste de 0,1%). */
  readonly ibsPercentageOfReference: bigint;
  readonly icmsIssPercentageInForce: number;
}

/**
 * Implementação provisória para desenvolvimento e testes (cenário de referência; conferir as
 * fontes em docs/especificacao.md, seção 3.1). Será substituída pela persistência (Oracle/SQLite).
 */
export class InMemoryTaxRateTableRepository implements TaxRateTableRepository {
  private static readonly CBS_REFERENCE = TaxRate.fromPercentage("8.8");
  private static readonly IBS_REFERENCE = TaxRate.fromPercentage("17.7");
  private static readonly RULES: Readonly<Record<number, YearRule>> = {
    2026: { cbsIsTestRate: true, ibsPercentageOfReference: 0n, icmsIssPercentageInForce: 100 },
    2027: { cbsIsTestRate: false, ibsPercentageOfReference: 0n, icmsIssPercentageInForce: 100 },
    2028: { cbsIsTestRate: false, ibsPercentageOfReference: 0n, icmsIssPercentageInForce: 100 },
    2029: { cbsIsTestRate: false, ibsPercentageOfReference: 10n, icmsIssPercentageInForce: 90 },
    2030: { cbsIsTestRate: false, ibsPercentageOfReference: 20n, icmsIssPercentageInForce: 80 },
    2031: { cbsIsTestRate: false, ibsPercentageOfReference: 30n, icmsIssPercentageInForce: 70 },
    2032: { cbsIsTestRate: false, ibsPercentageOfReference: 40n, icmsIssPercentageInForce: 60 },
    2033: { cbsIsTestRate: false, ibsPercentageOfReference: 100n, icmsIssPercentageInForce: 0 },
  };

  async transitionRatesFor(taxYear: TaxYear): Promise<TransitionRates> {
    const rule = InMemoryTaxRateTableRepository.RULES[taxYear.year];
    if (!rule) throw new EffectivePeriodNotFoundError("ALIQUOTA_TRANSICAO", taxYear.year);
    const cbs = rule.cbsIsTestRate ? TaxRate.fromPercentage("0.9") : InMemoryTaxRateTableRepository.CBS_REFERENCE;
    const ibs =
      rule.ibsPercentageOfReference === 0n
        ? TaxRate.fromPercentage("0.1")
        : InMemoryTaxRateTableRepository.IBS_REFERENCE.scale(rule.ibsPercentageOfReference, 100n);
    return {
      cbs,
      ibs,
      icmsIssPercentageInForce: rule.icmsIssPercentageInForce,
      pisCofinsExtinct: taxYear.year >= 2027,
    };
  }
}
