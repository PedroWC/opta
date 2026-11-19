import { DomainError } from "./domain-error.ts";

/** CNAE fora do escopo do MVP (serviços dos Anexos III e V). */
export class UnsupportedActivityError extends DomainError {
  readonly code = "SIM-004";

  constructor(cnae: string) {
    super(`Atividade ${cnae} não suportada pelo simulador (escopo: serviços dos Anexos III e V).`);
  }
}
