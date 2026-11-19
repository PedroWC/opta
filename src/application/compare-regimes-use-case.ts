import { RegimeComparison } from "../domain/comparison/regime-comparison.ts";
import type { CompanyProfile } from "../domain/shared/company-profile.ts";
import type { SimulateRegimesUseCase } from "./simulate-regimes-use-case.ts";

/** UC-01: simula os regimes e devolve a comparação com a recomendação explicada (RF-03, RN-08). */
export class CompareRegimesUseCase {
  constructor(private readonly simulateRegimes: SimulateRegimesUseCase) {}

  async execute(company: CompanyProfile): Promise<RegimeComparison> {
    return new RegimeComparison(await this.simulateRegimes.execute(company));
  }
}
