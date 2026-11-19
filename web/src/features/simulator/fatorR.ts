/**
 * Fator R aproximado, só como dica na tela (DEC-10): folha anual ÷ receita anual, em % inteiro. O cálculo oficial
 * (e o único que decide o anexo) é do backend. Usa BigInt sobre o texto decimal, sem `number` para dinheiro.
 */
export function approximateFatorR(revenue: string, payroll: string): number | null {
  const cents = (decimal: string): bigint | null => (/^\d+\.\d{2}$/.test(decimal) ? BigInt(decimal.replace(".", "")) : null);
  const revenueCents = cents(revenue);
  const payrollCents = cents(payroll);
  if (revenueCents === null || payrollCents === null || revenueCents === 0n) return null;
  return Number((payrollCents * 200n + revenueCents) / (revenueCents * 2n));
}
