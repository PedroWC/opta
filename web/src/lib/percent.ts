/**
 * Converte um percentual digitado ("5", "5,25", "5.5") no texto de 4 casas do contrato ("5.2500"), de 0 a 100 e
 * com no máximo 2 casas (como pede o formulário). Devolve null se for inválido.
 */
export function parsePercentInput(input: string): string | null {
  const match = /^(\d{1,3})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const whole = Number(match[1]);
  const fraction = (match[2] ?? "").padEnd(2, "0");
  if (whole > 100 || (whole === 100 && fraction !== "00")) return null;
  return `${whole}.${fraction}00`;
}
