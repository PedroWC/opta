import type { SimulationOutcome } from "../application/simulation-outcome.ts";
import type { Recommendation } from "../domain/comparison/recommendation.ts";
import type { AnnualResult } from "../domain/regimes/annual-result.ts";
import type { CompanyProfile } from "../domain/shared/company-profile.ts";
import { TaxRate } from "../domain/shared/tax-rate.ts";
import { TaxYear } from "../domain/shared/tax-year.ts";
import type { TaxLine } from "../domain/taxes/tax-line.ts";

/** Converte o resultado do domínio no formato do contrato OpenAPI: valores como texto decimal. */
export class SimulationResponseMapper {
  private static readonly FACTOR_CODES: Readonly<Record<string, string>> = {
    INCOME_TAXES: "TRIBUTOS_SOBRE_RENDA",
    PAYROLL_CHARGES: "ENCARGOS_SOBRE_FOLHA",
    CONSUMPTION_TAXES: "TRIBUTOS_SOBRE_CONSUMO",
    NONE: "NENHUM",
  };

  private static readonly NOTICES: readonly string[] = [
    "Simulador educacional: não é consultoria tributária.",
    "Alíquotas, tabelas e presunções são premissas de referência com conferência pendente na legislação (marcadas com ⚠️ na documentação) e podem mudar com a regulamentação.",
  ];

  toResponse(outcome: SimulationOutcome, company: CompanyProfile) {
    const revenue = company.annualGrossRevenue;
    return {
      premissas_versao: outcome.assumptionsVersion,
      anos: TaxYear.horizon().map((taxYear) => ({
        ano: taxYear.year,
        regimes: outcome.results
          .filter((result) => result.taxYear.year === taxYear.year)
          .map((result) => this.regimeOfYear(result, revenue.inCents())),
        melhor_regime: outcome.comparison.bestInYear(taxYear),
      })),
      recomendacao: this.recommendation(outcome.comparison.recommendation()),
      regimes_indisponiveis: outcome.unavailable.map((item) => ({
        regime: item.regime,
        codigo: item.error.code,
        detalhe: item.error.message,
      })),
      avisos: [...SimulationResponseMapper.NOTICES],
    };
  }

  private regimeOfYear(result: AnnualResult, revenueCents: bigint) {
    const total = result.totalBurden();
    return {
      regime: result.regime,
      carga_total: total.toString(),
      aliquota_efetiva: TaxRate.fromRatio(total.inCents(), revenueCents).toPercentageText(),
      tributos: result.lines.map((line) => this.line(line)),
    };
  }

  private line(line: TaxLine): Record<string, unknown> {
    return {
      codigo: line.code,
      base: line.base.toString(),
      aliquota: line.rate.toPercentageText(),
      valor: line.amount.toString(),
      fonte: line.source,
      ...(line.breakdown.length > 0 ? { detalhes: line.breakdown.map((part) => this.line(part)) } : {}),
    };
  }

  private recommendation(recommendation: Recommendation) {
    return {
      regime: recommendation.regime,
      motivo: recommendation.reason,
      economia_acumulada: recommendation.cumulativeSavings.toString(),
      fator_decisivo: {
        codigo: SimulationResponseMapper.FACTOR_CODES[recommendation.decisiveFactor.code] ?? "NENHUM",
        diferenca: recommendation.decisiveFactor.difference.toString(),
      },
      segundo_colocado: recommendation.runnerUp,
    };
  }
}
