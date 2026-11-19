import type { Activity } from "../domain/activity/activity.ts";
import type { ActivityPage } from "../domain/activity/activity-page.ts";
import { ResourceNotFoundError } from "../domain/errors/resource-not-found-error.ts";
import type { TaxRateTableRepository } from "../domain/ports/tax-rate-table-repository.ts";

/** RF-05: consulta de atividades por CNAE exato ou por texto (DEC-14). */
export class ActivityQueries {
  constructor(private readonly rateTables: TaxRateTableRepository) {}

  async byCnae(cnae: string): Promise<Activity> {
    const activity = await this.rateTables.findActivity(cnae);
    if (!activity) throw new ResourceNotFoundError("Atividade");
    return activity;
  }

  search(term: string, page: number, pageSize: number): Promise<ActivityPage> {
    return this.rateTables.searchActivities(term, page, pageSize);
  }
}
