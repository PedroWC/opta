import { readFileSync } from "node:fs";
import { ActivityQueries } from "./application/activity-queries.ts";
import { GetAssumptionsUseCase } from "./application/get-assumptions-use-case.ts";
import { RunSimulationUseCase } from "./application/run-simulation-use-case.ts";
import { SimulateRegimesUseCase } from "./application/simulate-regimes-use-case.ts";
import { LucroPresumido } from "./domain/regimes/lucro-presumido.ts";
import { SimplesHibrido } from "./domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "./domain/regimes/simples-nacional.ts";
import type { TaxRateTableRepository } from "./domain/ports/tax-rate-table-repository.ts";
import { RepositoryProvider } from "./infrastructure/sql/repository-provider.ts";
import { InMemoryTaxRateTableRepository } from "./infrastructure/in-memory-tax-rate-table-repository.ts";
import { HealthController } from "./presentation/health-controller.ts";
import { HttpServer } from "./presentation/http-server.ts";
import { ProblemDetailsHandler } from "./presentation/problem-details-handler.ts";
import { QueryValidator } from "./presentation/query-validator.ts";
import { ReferenceController } from "./presentation/reference-controller.ts";
import { SimulationController } from "./presentation/simulation-controller.ts";
import { SimulationRequestValidator } from "./presentation/simulation-request-validator.ts";
import { SimulationResponseMapper } from "./presentation/simulation-response-mapper.ts";


/** Única classe que conhece as implementações concretas (composição na raiz). */
export class CompositionRoot {
  readonly simulateRegimes: SimulateRegimesUseCase;
  readonly runSimulation: RunSimulationUseCase;
  readonly httpServer: HttpServer;

  constructor(rateTables: TaxRateTableRepository = new InMemoryTaxRateTableRepository()) {
    const regimes = [new SimplesNacional(), new SimplesHibrido(), new LucroPresumido()];
    this.simulateRegimes = new SimulateRegimesUseCase(regimes, rateTables);
    this.runSimulation = new RunSimulationUseCase(regimes, rateTables);
    const simulation = new SimulationController(
      new SimulationRequestValidator(),
      this.runSimulation,
      new SimulationResponseMapper(),
    );
    const reference = new ReferenceController(
      new QueryValidator(),
      new GetAssumptionsUseCase(rateTables),
      new ActivityQueries(rateTables),
      rateTables,
      CompositionRoot.serviceVersion(),
    );
    this.httpServer = new HttpServer(new HealthController(), simulation, reference, new ProblemDetailsHandler());
  }

  /**
   * Escolhe o repositório pela variável OPTA_DB: `memory` (padrão), `sqlite` (OPTA_SQLITE_PATH, padrão
   * `opta.db`) ou `oracle` (OPTA_ORACLE_*). Migra o esquema e as sementes antes de servir.
   */
  static async fromEnvironment(env: Readonly<Record<string, string | undefined>>): Promise<CompositionRoot> {
    return new CompositionRoot(await new RepositoryProvider().create(env));
  }

  /** Versão do serviço, lida do package.json (fonte única). */
  private static serviceVersion(): string {
    const file = readFileSync(new URL("../package.json", import.meta.url), "utf8");
    return (JSON.parse(file) as { version: string }).version;
  }
}
