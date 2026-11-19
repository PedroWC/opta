import type { Context } from "hono";
import { DomainError } from "../domain/errors/domain-error.ts";
import { InvalidInputError } from "../domain/errors/invalid-input-error.ts";
import { NotImplementedYetError } from "../domain/errors/not-implemented-yet-error.ts";

/** Formato único de erro: Problem Details (RFC 9457) — RNF-07. */
export class ProblemDetailsHandler {
  handle = (error: Error, c: Context): Response => {
    if (error instanceof DomainError) {
      const status = error instanceof InvalidInputError ? 422 : error instanceof NotImplementedYetError ? 501 : 500;
      return c.json({ type: "about:blank", title: error.name, status, detail: error.message, code: error.code }, status);
    }
    return c.json({ type: "about:blank", title: "Erro interno", status: 500 }, 500);
  };
}
