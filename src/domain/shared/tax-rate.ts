import { InvalidInputError } from "../errors/invalid-input-error.ts";
import { Money } from "./money.ts";

/** Alíquota como inteiro em milionésimos (100% = 1.000.000): precisão exata, sem ponto flutuante. */
export class TaxRate {
  private static readonly SCALE = 1_000_000n;

  private constructor(private readonly micro: bigint) {}

  /** Percentual em texto, ex.: "8.8" equivale a 8,8%. Até 4 casas decimais. */
  static fromPercentage(text: string): TaxRate {
    const match = /^(\d+)(?:\.(\d{1,4}))?$/.exec(text.trim());
    if (!match) throw new InvalidInputError(`Alíquota inválida: "${text}"`);
    const [, integerPart = "0", fractionPart = ""] = match;
    return new TaxRate(BigInt(integerPart) * 10_000n + BigInt(fractionPart.padEnd(4, "0") || "0"));
  }

  static zero(): TaxRate {
    return new TaxRate(0n);
  }

  applyTo(base: Money): Money {
    return base.multiplyByRatio(this.micro, TaxRate.SCALE);
  }

  scale(numerator: bigint, denominator: bigint): TaxRate {
    return new TaxRate((this.micro * numerator) / denominator);
  }

  toString(): string {
    return `${this.micro / 10_000n}.${(this.micro % 10_000n).toString().padStart(4, "0")}%`;
  }
}
