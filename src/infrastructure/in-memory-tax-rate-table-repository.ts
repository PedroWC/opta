import { EffectivePeriodNotFoundError } from "../domain/errors/effective-period-not-found-error.ts";
import type { TaxRateTableRepository, TransitionRates } from "../domain/ports/tax-rate-table-repository.ts";
import { UnsupportedActivityError } from "../domain/errors/unsupported-activity-error.ts";
import { FixedAnnexActivity, PayrollFactorActivity } from "../domain/simples/simples-activity.ts";
import type { SimplesActivity } from "../domain/simples/simples-activity.ts";
import type { SimplesAnnex } from "../domain/simples/simples-annex.ts";
import type { SimplesAnnexTable } from "../domain/simples/simples-annex-table.ts";
import { SimplesReferenceTables } from "./simples-reference-tables.ts";
import { LucroPresumidoParameters } from "../domain/presumption/lucro-presumido-parameters.ts";
import { Presumption } from "../domain/presumption/presumption.ts";
import { Money } from "../domain/shared/money.ts";
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

  private static readonly PAYROLL_FACTOR_CNAES: readonly string[] = [
    "6201-5/01", "6201-5/02", "6202-3/00", "6203-1/00", "6204-0/00", "6209-1/00", "6311-9/00",
  ];
  private static readonly ANNEX_III_CNAES: readonly string[] = ["8630-5/04", "9602-5/01", "6920-6/01"];

  private static readonly SERVICE_CNAES: readonly string[] = [
    ...InMemoryTaxRateTableRepository.PAYROLL_FACTOR_CNAES,
    ...InMemoryTaxRateTableRepository.ANNEX_III_CNAES,
  ];
  private static readonly COMMERCE_CNAES: readonly string[] = ["4711-3/02", "4781-4/00", "4761-0/03"];

  private readonly simplesTables = new SimplesReferenceTables();

  async simplesAnnexTableFor(annex: SimplesAnnex): Promise<SimplesAnnexTable> {
    // Cenário de referência: as mesmas faixas valem nos 8 anos (o total do DAS não muda na transição).
    return this.simplesTables.tableFor(annex);
  }

  /** Mapa provisório de CNAE para anexo (⚠️ conferir); será a tabela ATIVIDADE_CNAE (issue #3). */
  async simplesActivityFor(cnae: string): Promise<SimplesActivity> {
    if (InMemoryTaxRateTableRepository.PAYROLL_FACTOR_CNAES.includes(cnae)) return new PayrollFactorActivity();
    if (InMemoryTaxRateTableRepository.ANNEX_III_CNAES.includes(cnae)) return new FixedAnnexActivity("III");
    throw new UnsupportedActivityError(cnae);
  }

  /** Presunção: serviços 32%/32%; comércio 8% e 12% (⚠️ conferir; sem a majoração da LC 224/2025). */
  async presumptionFor(cnae: string): Promise<Presumption> {
    if (InMemoryTaxRateTableRepository.SERVICE_CNAES.includes(cnae)) {
      return new Presumption("SERVICE", TaxRate.fromPercentage("32"), TaxRate.fromPercentage("32"));
    }
    if (InMemoryTaxRateTableRepository.COMMERCE_CNAES.includes(cnae)) {
      return new Presumption("COMMERCE", TaxRate.fromPercentage("8"), TaxRate.fromPercentage("12"));
    }
    throw new UnsupportedActivityError(cnae);
  }

  async lucroPresumidoParametersFor(): Promise<LucroPresumidoParameters> {
    return new LucroPresumidoParameters(
      TaxRate.fromPercentage("15"),
      TaxRate.fromPercentage("10"),
      Money.fromText("20000"),
      TaxRate.fromPercentage("9"),
      TaxRate.fromPercentage("20"),
    );
  }

  /** PIS 0,65% + Cofins 3% (⚠️ conferir). Extinto a partir de 2027 pela transição. */
  async cumulativePisCofinsRate(): Promise<TaxRate> {
    return TaxRate.fromPercentage("3.65");
  }

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
      consumptionTestYear: taxYear.year === 2026,
    };
  }
}
