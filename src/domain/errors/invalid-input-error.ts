import { DomainError } from "./domain-error.ts";

export class InvalidInputError extends DomainError {
  readonly code = "SIM-001";
}
