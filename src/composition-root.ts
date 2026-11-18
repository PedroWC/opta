import { SimulateRegimesUseCase } from "./application/simulate-regimes-use-case.ts";
import { LucroPresumido } from "./domain/regimes/lucro-presumido.ts";
import { SimplesHibrido } from "./domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "./domain/regimes/simples-nacional.ts";
import { InMemoryTaxRateTableRepository } from "./infrastructure/in-memory-tax-rate-table-repository.ts";
import { HealthController } from "./presentation/health-controller.ts";
import { HttpServer } from "./presentation/http-server.ts";
import { ProblemDetailsHandler } from "./presentation/problem-details-handler.ts";

/** Única classe que conhece as implementações concretas (composição na raiz). */
export class CompositionRoot {
  readonly simulateRegimes: SimulateRegimesUseCase;
  readonly httpServer: HttpServer;

  constructor() {
    const rateTables = new InMemoryTaxRateTableRepository();
    this.simulateRegimes = new SimulateRegimesUseCase(
      [new SimplesNacional(), new SimplesHibrido(), new LucroPresumido()],
      rateTables,
    );
    this.httpServer = new HttpServer(new HealthController(), new ProblemDetailsHandler());
  }
}
