import { DomainError } from "../domain/errors/domain-error.ts";
import { EffectivePeriodNotFoundError } from "../domain/errors/effective-period-not-found-error.ts";
import { InvalidInputError } from "../domain/errors/invalid-input-error.ts";
import { NotImplementedYetError } from "../domain/errors/not-implemented-yet-error.ts";
import { SimplesLimitExceededError } from "../domain/errors/simples-limit-exceeded-error.ts";
import { UnsupportedActivityError } from "../domain/errors/unsupported-activity-error.ts";
import { MalformedRequestError } from "./malformed-request-error.ts";
import { ValidationFailedError } from "./validation-failed-error.ts";

/** Formato único de erro: Problem Details (RFC 9457) em application/problem+json — RNF-07. */
export class ProblemDetailsHandler {
  private static readonly CONTENT_TYPE = "application/problem+json";

  handle = (error: Error): Response => {
    if (error instanceof MalformedRequestError) return this.respond(400, error.code, "Requisição malformada", error.message);
    if (error instanceof ValidationFailedError) {
      return this.respond(422, error.code, "Entrada inválida", error.message, { errors: error.fields });
    }
    if (error instanceof DomainError) {
      return this.respond(this.statusOf(error), error.code, error.name, error.message);
    }
    // Erro inesperado: nada da mensagem interna vai para a resposta (RNF-06).
    return this.respond(500, "SIM-500", "Erro interno", "Ocorreu um erro inesperado.");
  };

  notFound = (): Response => this.respond(404, "SIM-005", "Recurso não encontrado", "Rota inexistente.");

  private statusOf(error: DomainError): 422 | 500 | 501 {
    if (error instanceof NotImplementedYetError) return 501;
    const clientError =
      error instanceof InvalidInputError ||
      error instanceof SimplesLimitExceededError ||
      error instanceof UnsupportedActivityError ||
      error instanceof EffectivePeriodNotFoundError;
    return clientError ? 422 : 500;
  }

  private respond(
    status: 400 | 404 | 422 | 500 | 501,
    code: string,
    title: string,
    detail: string,
    extra: Record<string, unknown> = {},
  ): Response {
    const body = { type: "about:blank", title, status, detail, code, ...extra };
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": ProblemDetailsHandler.CONTENT_TYPE },
    });
  }
}
