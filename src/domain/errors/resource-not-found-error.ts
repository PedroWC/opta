import { DomainError } from "./domain-error.ts";

/** Recurso consultado não existe (404, SIM-005). */
export class ResourceNotFoundError extends DomainError {
  readonly code = "SIM-005";

  constructor(resource: string) {
    super(`${resource} não encontrado.`);
  }
}
