import { SimplesLimitExceededError } from "../errors/simples-limit-exceeded-error.ts";
import type { Money } from "../shared/money.ts";
import type { SimplesAnnex } from "./simples-annex.ts";
import type { SimplesBracket } from "./simples-bracket.ts";

/** Tabela de um anexo do Simples, com as faixas em ordem crescente de RBT12. */
export class SimplesAnnexTable {
  constructor(
    readonly annex: SimplesAnnex,
    readonly brackets: readonly SimplesBracket[],
  ) {}

  bracketFor(rbt12: Money): SimplesBracket {
    const bracket = this.brackets.find((candidate) => candidate.contains(rbt12));
    if (!bracket) {
      const last = this.brackets[this.brackets.length - 1];
      throw new SimplesLimitExceededError(rbt12.toString(), last ? last.upTo.toString() : "0.00");
    }
    return bracket;
  }
}
