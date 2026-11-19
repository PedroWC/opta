import type { Context } from "hono";
import type { RunSimulationUseCase } from "../application/run-simulation-use-case.ts";
import { MalformedRequestError } from "./malformed-request-error.ts";
import type { SimulationRequestValidator } from "./simulation-request-validator.ts";
import type { SimulationResponseMapper } from "./simulation-response-mapper.ts";

/** POST /v1/simulacoes: lê o corpo, valida, executa o caso de uso e mapeia a resposta (UC-01). */
export class SimulationController {
  constructor(
    private readonly validator: SimulationRequestValidator,
    private readonly useCase: RunSimulationUseCase,
    private readonly mapper: SimulationResponseMapper,
  ) {}

  handle = async (c: Context): Promise<Response> => {
    const body = await this.readJson(c);
    const { company, regimes } = this.validator.validate(body);
    const outcome = await this.useCase.execute(company, regimes);
    return c.json(this.mapper.toResponse(outcome, company));
  };

  private async readJson(c: Context): Promise<unknown> {
    const contentType = c.req.header("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new MalformedRequestError("Envie o corpo como application/json.");
    }
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw new MalformedRequestError("O corpo não é um JSON válido.");
    }
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      throw new MalformedRequestError("O corpo deve ser um objeto JSON.");
    }
    return body;
  }
}
