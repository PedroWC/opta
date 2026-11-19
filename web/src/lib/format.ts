import { formatMoneyText } from "./money.ts";

/** "1800000.50" vira "R$ 1.800.000,50" (pt-BR). Nunca passa por `number` (RNF-02). */
export function formatBRL(decimal: string): string {
  const negative = decimal.startsWith("-");
  return `${negative ? "-" : ""}R$ ${formatMoneyText(negative ? decimal.slice(1) : decimal)}`;
}

/** "8.0800" vira "8,08%": arredonda a duas casas (meio para cima), em aritmética inteira. */
export function formatRate(percentage: string): string {
  const [whole = "0", fraction = "0000"] = percentage.split(".");
  const micro = BigInt(whole) * 10_000n + BigInt(fraction.padEnd(4, "0").slice(0, 4));
  const hundredths = (micro + 50n) / 100n;
  const text = hundredths.toString().padStart(3, "0");
  return `${text.slice(0, -2)},${text.slice(-2)}%`;
}

/** Soma textos decimais de dinheiro em centavos (BigInt) e devolve o texto decimal. */
export function sumMoney(values: readonly string[]): string {
  const cents = values.reduce((total, value) => total + BigInt(value.replace(".", "")), 0n);
  const negative = cents < 0n;
  const absolute = (negative ? -cents : cents).toString().padStart(3, "0");
  return `${negative ? "-" : ""}${absolute.slice(0, -2)}.${absolute.slice(-2)}`;
}
