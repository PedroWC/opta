import { DomainError } from "./domain-error.ts";

/** Marca pontos do esqueleto que dependem de uma issue do backlog inicial. */
export class NotImplementedYetError extends DomainError {
  readonly code = "SIM-999";

  constructor(feature: string) {
    super(`Ainda não implementado: ${feature}`);
  }
}
