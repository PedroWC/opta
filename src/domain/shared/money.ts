import { InvalidInputError } from "../errors/invalid-input-error.ts";

/**
 * Valor monetário imutável em centavos (bigint). Nunca usar `number` para dinheiro:
 * evita erros de ponto flutuante nas fórmulas fiscais (RN-03).
 */
export class Money {
  private constructor(private readonly cents: bigint) {}

  static zero(): Money {
    return new Money(0n);
  }

  static fromCents(cents: bigint): Money {
    return new Money(cents);
  }

  /** Aceita "1234.56" (até 2 casas). Rejeita notação científica e excesso de casas. */
  static fromText(text: string): Money {
    const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(text.trim());
    if (!match) throw new InvalidInputError(`Valor monetário inválido: "${text}"`);
    const [, signText = "", integerPart = "0", fractionPart = ""] = match;
    const sign = signText === "-" ? -1n : 1n;
    const cents = BigInt(integerPart) * 100n + BigInt(fractionPart.padEnd(2, "0") || "0");
    return new Money(sign * cents);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /** Multiplica por num/den com arredondamento meio para cima (afastando de zero). */
  multiplyByRatio(numerator: bigint, denominator: bigint): Money {
    if (denominator === 0n) throw new InvalidInputError("Denominador zero.");
    const product = this.cents * numerator;
    const half = denominator / 2n;
    const adjustment = product >= 0n ? half : -half;
    return new Money((product + adjustment) / denominator);
  }

  greaterThan(other: Money): boolean {
    return this.cents > other.cents;
  }

  isNegative(): boolean {
    return this.cents < 0n;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  inCents(): bigint {
    return this.cents;
  }

  toString(): string {
    const abs = this.cents < 0n ? -this.cents : this.cents;
    const sign = this.cents < 0n ? "-" : "";
    return `${sign}${abs / 100n}.${(abs % 100n).toString().padStart(2, "0")}`;
  }
}
