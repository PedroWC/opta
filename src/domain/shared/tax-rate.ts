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

  /** Razão num/den como alíquota de 4 casas (meio para cima). Denominador zero resulta em 0%. */
  static fromRatio(numerator: bigint, denominator: bigint): TaxRate {
    if (denominator === 0n) return TaxRate.zero();
    return new TaxRate(TaxRate.divideRounded(numerator * TaxRate.SCALE, denominator));
  }

  /**
   * Alíquota efetiva do Simples: (receita x nominal - parcela a deduzir) / receita (RN-04).
   * Calculada com inteiros, sem arredondar o numerador; nunca negativa.
   */
  static effective(nominal: TaxRate, revenue: Money, deduction: Money): TaxRate {
    const revenueCents = revenue.inCents();
    if (revenueCents === 0n) return TaxRate.zero();
    const numerator = revenueCents * nominal.micro - deduction.inCents() * TaxRate.SCALE;
    if (numerator <= 0n) return TaxRate.zero();
    return new TaxRate(TaxRate.divideRounded(numerator, revenueCents));
  }

  add(other: TaxRate): TaxRate {
    return new TaxRate(this.micro + other.micro);
  }

  equals(other: TaxRate): boolean {
    return this.micro === other.micro;
  }

  greaterThan(other: TaxRate): boolean {
    return this.micro > other.micro;
  }

  /** Divisão inteira com arredondamento meio para cima (valores não negativos). */
  private static divideRounded(numerator: bigint, denominator: bigint): bigint {
    return (numerator * 2n + denominator) / (denominator * 2n);
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
