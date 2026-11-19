import { Hono } from "hono";
import { compress } from "hono/compress";
import type { HealthController } from "./health-controller.ts";
import type { ProblemDetailsHandler } from "./problem-details-handler.ts";
import type { StaticSiteController } from "./static-site-controller.ts";
import type { ReferenceController } from "./reference-controller.ts";
import type { SecurityHeaders } from "./security-headers.ts";
import type { SimulationController } from "./simulation-controller.ts";

/** Adaptador fino do Hono: as rotas delegam a controllers (classes). */
export class HttpServer {
  private readonly app = new Hono();

  constructor(
    health: HealthController,
    simulation: SimulationController,
    reference: ReferenceController,
    problems: ProblemDetailsHandler,
    security: SecurityHeaders,
    site?: StaticSiteController,
  ) {
    this.app.use("*", security.middleware);
    this.app.use("*", compress());
    this.app.get("/v1/health", health.handle);
    this.app.post("/v1/simulacoes", simulation.handle);
    this.app.get("/v1/premissas/aliquotas", reference.rates);
    this.app.get("/v1/atividades", reference.activitiesRoute);
    this.app.get("/v1/versao", reference.version);
    this.app.onError(problems.handle);
    this.app.notFound(async (c) => {
      // O front-end (se configurado) responde às rotas que não são da API; a API nunca devolve HTML.
      if (site && c.req.method === "GET" && !c.req.path.startsWith("/v1/")) {
        const response = await site.handle(c);
        if (response) return response;
      }
      return problems.notFound();
    });
  }

  fetchHandler(): (request: Request) => Response | Promise<Response> {
    return this.app.fetch;
  }
}
