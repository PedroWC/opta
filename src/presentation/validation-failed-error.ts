import { InvalidInputError } from "../domain/errors/invalid-input-error.ts";

export interface FieldError {
  readonly pointer: string;
  readonly detail: string;
}

/** Entrada inválida com os erros por campo (422, SIM-001). */
export class ValidationFailedError extends InvalidInputError {
  constructor(readonly fields: readonly FieldError[]) {
    super("Corrija os campos indicados.");
  }
}
