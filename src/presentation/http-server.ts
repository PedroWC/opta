import { Hono } from "hono";
import type { HealthController } from "./health-controller.ts";
import type { ProblemDetailsHandler } from "./problem-details-handler.ts";

/** Adaptador fino do Hono: as rotas delegam a controllers (classes). */
export class HttpServer {
  private readonly app = new Hono();

  constructor(health: HealthController, problems: ProblemDetailsHandler) {
    this.app.get("/v1/health", health.handle);
    this.app.onError(problems.handle);
  }

  fetchHandler(): (request: Request) => Response | Promise<Response> {
    return this.app.fetch;
  }
}
