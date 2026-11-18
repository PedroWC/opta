import { DomainError } from "./domain-error.ts";

export class EffectivePeriodNotFoundError extends DomainError {
  readonly code = "SIM-002";

  constructor(table: string, year: number) {
    super(`Não há parâmetros vigentes em ${table} para o ano ${year}.`);
  }
}
