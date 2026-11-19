import { RunSimulationUseCase } from "./application/run-simulation-use-case.ts";
import { SimulateRegimesUseCase } from "./application/simulate-regimes-use-case.ts";
import { LucroPresumido } from "./domain/regimes/lucro-presumido.ts";
import { SimplesHibrido } from "./domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "./domain/regimes/simples-nacional.ts";
import { InMemoryTaxRateTableRepository } from "./infrastructure/in-memory-tax-rate-table-repository.ts";
import { HealthController } from "./presentation/health-controller.ts";
import { HttpServer } from "./presentation/http-server.ts";
import { ProblemDetailsHandler } from "./presentation/problem-details-handler.ts";
import { SimulationController } from "./presentation/simulation-controller.ts";
import { SimulationRequestValidator } from "./presentation/simulation-request-validator.ts";
import { SimulationResponseMapper } from "./presentation/simulation-response-mapper.ts";

/** Única classe que conhece as implementações concretas (composição na raiz). */
export class CompositionRoot {
  readonly simulateRegimes: SimulateRegimesUseCase;
  readonly runSimulation: RunSimulationUseCase;
  readonly httpServer: HttpServer;

  constructor() {
    const rateTables = new InMemoryTaxRateTableRepository();
    const regimes = [new SimplesNacional(), new SimplesHibrido(), new LucroPresumido()];
    this.simulateRegimes = new SimulateRegimesUseCase(regimes, rateTables);
    this.runSimulation = new RunSimulationUseCase(regimes, rateTables);
    const simulation = new SimulationController(
      new SimulationRequestValidator(),
      this.runSimulation,
      new SimulationResponseMapper(),
    );
    this.httpServer = new HttpServer(new HealthController(), simulation, new ProblemDetailsHandler());
  }
}
