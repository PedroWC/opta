import type { Context } from "hono";
import type { ActivityQueries } from "../application/activity-queries.ts";
import type { GetAssumptionsUseCase } from "../application/get-assumptions-use-case.ts";
import type { Activity } from "../domain/activity/activity.ts";
import type { TaxRateTableRepository } from "../domain/ports/tax-rate-table-repository.ts";
import { TaxYear } from "../domain/shared/tax-year.ts";
import type { QueryValidator } from "./query-validator.ts";

/** Rotas de leitura: premissas (RF-04), atividades (RF-05) e versão (RF-07). */
export class ReferenceController {
  constructor(
    private readonly validator: QueryValidator,
    private readonly assumptions: GetAssumptionsUseCase,
    private readonly activities: ActivityQueries,
    private readonly rateTables: TaxRateTableRepository,
    private readonly serviceVersion: string,
  ) {}

  rates = async (c: Context): Promise<Response> => {
    const { year } = this.validator.assumptions(c.req.query());
    const result = await this.assumptions.execute(year === undefined ? undefined : TaxYear.of(year));
    return c.json({
      premissas_versao: result.version,
      anos: result.years.map(({ taxYear, rates }) => ({
        ano: taxYear.year,
        cbs: rates.cbs.toPercentageText(),
        ibs: rates.ibs.toPercentageText(),
        icms_iss_vigente_pct: rates.icmsIssPercentageInForce,
        pis_cofins_extinto: rates.pisCofinsExtinct,
        ano_de_teste: rates.consumptionTestYear,
      })),
    });
  };

  activitiesRoute = async (c: Context): Promise<Response> => {
    const query = this.validator.activity(c.req.query());
    if (query.kind === "cnae") return c.json(this.activity(await this.activities.byCnae(query.cnae)));
    const page = await this.activities.search(query.term, query.page, query.pageSize);
    return c.json({ itens: page.items.map((item) => this.activity(item)), pagina: page.page, tem_proxima: page.hasNext });
  };

  version = async (c: Context): Promise<Response> =>
    c.json({ versao: this.serviceVersion, premissas_versao: await this.rateTables.assumptionsVersion() });

  private activity(activity: Activity): Record<string, unknown> {
    return {
      cnae: activity.cnae,
      descricao: activity.description,
      natureza: activity.kind === "SERVICE" ? "SERVICO" : "COMERCIO",
      ...(activity.simples ? { anexo_simples: activity.simples.annexWithoutPayrollFactor() } : {}),
      usa_fator_r: activity.simples?.usesPayrollFactor() ?? false,
      presuncao_irpj: activity.presumption.irpjRate.toPercentageText(),
      presuncao_csll: activity.presumption.csllRate.toPercentageText(),
    };
  }
}
