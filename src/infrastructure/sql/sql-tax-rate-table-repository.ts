import { Activity } from "../../domain/activity/activity.ts";
import { ActivityPage } from "../../domain/activity/activity-page.ts";
import { EffectivePeriodNotFoundError } from "../../domain/errors/effective-period-not-found-error.ts";
import { UnsupportedActivityError } from "../../domain/errors/unsupported-activity-error.ts";
import type { TaxRateTableRepository, TransitionRates } from "../../domain/ports/tax-rate-table-repository.ts";
import { LucroPresumidoParameters } from "../../domain/presumption/lucro-presumido-parameters.ts";
import type { ActivityKind } from "../../domain/presumption/activity-kind.ts";
import { Presumption } from "../../domain/presumption/presumption.ts";
import { Money } from "../../domain/shared/money.ts";
import { TaxRate } from "../../domain/shared/tax-rate.ts";
import type { TaxYear } from "../../domain/shared/tax-year.ts";
import { DasPartition } from "../../domain/simples/das-partition.ts";
import type { DasComponent } from "../../domain/simples/das-component.ts";
import { FixedAnnexActivity, PayrollFactorActivity, type SimplesActivity } from "../../domain/simples/simples-activity.ts";
import type { SimplesAnnex } from "../../domain/simples/simples-annex.ts";
import { SimplesAnnexTable } from "../../domain/simples/simples-annex-table.ts";
import { SimplesBracket } from "../../domain/simples/simples-bracket.ts";
import type { SqlExecutor, SqlRow } from "./sql-executor.ts";

/**
 * Repositório das tabelas fiscais sobre SQL (SQLite ou Oracle, via `SqlExecutor`). Tudo que muda por lei
 * tem vigência (VIG_INI/VIG_FIM) e é consultado na data de referência do ano, com bind variables (ADR-0004).
 */
export class SqlTaxRateTableRepository implements TaxRateTableRepository {
  private static readonly IN_FORCE = "VIG_INI <= :ref AND (VIG_FIM IS NULL OR VIG_FIM >= :ref)";
  private static readonly COMPONENTS: readonly DasComponent[] = ["IRPJ", "CSLL", "COFINS", "PIS", "CPP", "ISS"];

  constructor(private readonly executor: SqlExecutor) {}

  async transitionRatesFor(taxYear: TaxYear): Promise<TransitionRates> {
    const [row] = await this.executor.query(
      `SELECT CBS_PCT AS CBS_PCT, IBS_PCT AS IBS_PCT, ICMS_ISS_VIGENTE_PCT AS ICMS_ISS_VIGENTE_PCT,
              PIS_COFINS_EXTINTO AS PIS_COFINS_EXTINTO, ANO_TESTE AS ANO_TESTE
         FROM ALIQUOTA_TRANSICAO WHERE ANO = :ano AND ${SqlTaxRateTableRepository.IN_FORCE}`,
      { ano: taxYear.year, ref: this.reference(taxYear) },
    );
    if (!row) throw new EffectivePeriodNotFoundError("ALIQUOTA_TRANSICAO", taxYear.year);
    return {
      cbs: TaxRate.fromPercentage(this.text(row, "CBS_PCT")),
      ibs: TaxRate.fromPercentage(this.text(row, "IBS_PCT")),
      icmsIssPercentageInForce: Number(row["ICMS_ISS_VIGENTE_PCT"]),
      pisCofinsExtinct: Number(row["PIS_COFINS_EXTINTO"]) === 1,
      consumptionTestYear: Number(row["ANO_TESTE"]) === 1,
    };
  }

  async simplesAnnexTableFor(annex: SimplesAnnex, taxYear: TaxYear): Promise<SimplesAnnexTable> {
    const binds = { anexo: annex, ref: this.reference(taxYear) };
    const brackets = await this.executor.query(
      `SELECT FAIXA AS FAIXA, RBT12_ATE AS RBT12_ATE, ALIQ_NOMINAL AS ALIQ_NOMINAL, PARC_DEDUZIR AS PARC_DEDUZIR
         FROM SIMPLES_ANEXO_FAIXA WHERE ANEXO = :anexo AND ${SqlTaxRateTableRepository.IN_FORCE} ORDER BY FAIXA`,
      binds,
    );
    if (brackets.length === 0) throw new EffectivePeriodNotFoundError("SIMPLES_ANEXO_FAIXA", taxYear.year);
    const shares = await this.executor.query(
      `SELECT FAIXA AS FAIXA, TRIBUTO AS TRIBUTO, PCT AS PCT
         FROM SIMPLES_REPARTICAO WHERE ANEXO = :anexo AND ${SqlTaxRateTableRepository.IN_FORCE}`,
      binds,
    );
    return new SimplesAnnexTable(
      annex,
      brackets.map((row) => {
        const position = Number(row["FAIXA"]);
        return new SimplesBracket(
          position,
          Money.fromText(this.text(row, "RBT12_ATE")),
          TaxRate.fromPercentage(this.text(row, "ALIQ_NOMINAL")),
          Money.fromText(this.text(row, "PARC_DEDUZIR")),
          this.partition(shares.filter((share) => Number(share["FAIXA"]) === position), taxYear),
        );
      }),
    );
  }

  async findActivity(cnae: string): Promise<Activity | null> {
    const [row] = await this.executor.query(`${this.activitySelect()} WHERE CNAE = :cnae`, { cnae });
    return row ? this.toActivity(row) : null;
  }

  async searchActivities(term: string, page: number, pageSize: number): Promise<ActivityPage> {
    // O catálogo é curto: a busca sem acento/maiúsculas fica no domínio (Activity.matches).
    const found = (await this.executor.query(`${this.activitySelect()} ORDER BY ORDEM`))
      .map((row) => this.toActivity(row))
      .filter((activity) => activity.matches(term));
    const start = (page - 1) * pageSize;
    return new ActivityPage(found.slice(start, start + pageSize), page, found.length > start + pageSize);
  }

  async simplesActivityFor(cnae: string): Promise<SimplesActivity> {
    const simples = (await this.findActivity(cnae))?.simples;
    if (!simples) throw new UnsupportedActivityError(cnae);
    return simples;
  }

  async presumptionFor(cnae: string): Promise<Presumption> {
    const activity = await this.findActivity(cnae);
    if (!activity) throw new UnsupportedActivityError(cnae);
    return activity.presumption;
  }

  async lucroPresumidoParametersFor(taxYear: TaxYear): Promise<LucroPresumidoParameters> {
    const values = await this.parameters("LUCRO_PRESUMIDO", taxYear);
    const need = (key: string): string => {
      const value = values.get(key);
      if (value === undefined) throw new EffectivePeriodNotFoundError(`REGIME_PARAMETRO(${key})`, taxYear.year);
      return value;
    };
    return new LucroPresumidoParameters(
      TaxRate.fromPercentage(need("IRPJ_ALIQ")),
      TaxRate.fromPercentage(need("IRPJ_ADICIONAL_ALIQ")),
      Money.fromText(need("IRPJ_ADICIONAL_LIMITE_MENSAL")),
      TaxRate.fromPercentage(need("CSLL_ALIQ")),
      TaxRate.fromPercentage(need("CPP_ALIQ")),
    );
  }

  async cumulativePisCofinsRate(taxYear: TaxYear): Promise<TaxRate> {
    const rate = (await this.parameters("PIS_COFINS_CUMULATIVO", taxYear)).get("ALIQ");
    if (rate === undefined) throw new EffectivePeriodNotFoundError("REGIME_PARAMETRO(PIS_COFINS_CUMULATIVO)", taxYear.year);
    return TaxRate.fromPercentage(rate);
  }

  async assumptionsVersion(): Promise<string> {
    const [row] = await this.executor.query(
      `SELECT VALOR AS VALOR FROM REGIME_PARAMETRO
        WHERE REGIME = :regime AND CHAVE = :chave AND VIG_FIM IS NULL ORDER BY VIG_INI DESC`,
      { regime: "PREMISSAS", chave: "VERSAO" },
    );
    if (!row) throw new EffectivePeriodNotFoundError("REGIME_PARAMETRO(PREMISSAS)", 0);
    return this.text(row, "VALOR");
  }

  private async parameters(regime: string, taxYear: TaxYear): Promise<Map<string, string>> {
    const rows = await this.executor.query(
      `SELECT CHAVE AS CHAVE, VALOR AS VALOR FROM REGIME_PARAMETRO WHERE REGIME = :regime AND ${SqlTaxRateTableRepository.IN_FORCE}`,
      { regime, ref: this.reference(taxYear) },
    );
    return new Map(rows.map((row) => [this.text(row, "CHAVE"), this.text(row, "VALOR")]));
  }

  private partition(rows: readonly SqlRow[], taxYear: TaxYear): DasPartition {
    const byComponent = new Map(rows.map((row) => [this.text(row, "TRIBUTO"), this.text(row, "PCT")]));
    const rate = (component: DasComponent): TaxRate => {
      const pct = byComponent.get(component);
      if (pct === undefined) throw new EffectivePeriodNotFoundError(`SIMPLES_REPARTICAO(${component})`, taxYear.year);
      return TaxRate.fromPercentage(pct);
    };
    const shares = Object.fromEntries(SqlTaxRateTableRepository.COMPONENTS.map((c) => [c, rate(c)])) as Record<DasComponent, TaxRate>;
    return new DasPartition(shares);
  }

  private activitySelect(): string {
    return `SELECT CNAE AS CNAE, DESCRICAO AS DESCRICAO, NATUREZA AS NATUREZA, ANEXO_SEM_FATOR_R AS ANEXO_SEM_FATOR_R,
                   USA_FATOR_R AS USA_FATOR_R, PRESUNCAO_IRPJ AS PRESUNCAO_IRPJ, PRESUNCAO_CSLL AS PRESUNCAO_CSLL
              FROM ATIVIDADE_CNAE`;
  }

  private toActivity(row: SqlRow): Activity {
    const kind = this.text(row, "NATUREZA") as ActivityKind;
    const annex = row["ANEXO_SEM_FATOR_R"];
    const simples =
      annex === null || annex === undefined
        ? null
        : Number(row["USA_FATOR_R"]) === 1
          ? new PayrollFactorActivity()
          : new FixedAnnexActivity(String(annex) as SimplesAnnex);
    return new Activity(
      this.text(row, "CNAE"),
      this.text(row, "DESCRICAO"),
      kind,
      simples,
      new Presumption(
        kind,
        TaxRate.fromPercentage(this.text(row, "PRESUNCAO_IRPJ")),
        TaxRate.fromPercentage(this.text(row, "PRESUNCAO_CSLL")),
      ),
    );
  }

  /** Data de referência do ano: início do ano fiscal. */
  private reference(taxYear: TaxYear): string {
    return `${taxYear.year}-01-01`;
  }

  private text(row: SqlRow, column: string): string {
    return String(row[column]);
  }
}
