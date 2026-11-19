import { Hono } from "hono";
import type { HealthController } from "./health-controller.ts";
import type { ProblemDetailsHandler } from "./problem-details-handler.ts";
import type { SimulationController } from "./simulation-controller.ts";

/** Adaptador fino do Hono: as rotas delegam a controllers (classes). */
export class HttpServer {
  private readonly app = new Hono();

  constructor(
    health: HealthController,
    simulation: SimulationController,
    problems: ProblemDetailsHandler,
  ) {
    this.app.get("/v1/health", health.handle);
    this.app.post("/v1/simulacoes", simulation.handle);
    this.app.onError(problems.handle);
    this.app.notFound(problems.notFound);
  }

  fetchHandler(): (request: Request) => Response | Promise<Response> {
    return this.app.fetch;
  }
}
