import { DomainError } from "./domain-error.ts";

/** A receita bruta dos últimos 12 meses ultrapassa o teto do Simples Nacional (RN-04). */
export class SimplesLimitExceededError extends DomainError {
  readonly code = "SIM-003";

  constructor(rbt12Text: string, limitText: string) {
    super(`RBT12 de ${rbt12Text} acima do limite do Simples Nacional (${limitText}).`);
  }
}
