/**
 * Converte o que a pessoa digita ("1.800.000,50", "1800000.5", "R$ 1.500") no texto decimal do contrato
 * ("1800000.50"), sem usar `number` (RNF-02). Devolve null se não for um valor monetário válido.
 */
export function parseMoneyInput(input: string): string | null {
  const text = input.replace(/R\$/g, "").replace(/\s/g, "");
  if (text === "") return null;
  const hasComma = text.includes(",");
  const normalized = hasComma ? text.replace(/\./g, "").replace(",", ".") : text.replace(/\.(?=\d{3}(\D|$))/g, "");
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized);
  if (!match) return null;
  return `${match[1]}.${(match[2] ?? "").padEnd(2, "0")}`;
}

/** Exibe o texto decimal do contrato em pt-BR ("1800000.50" vira "1.800.000,50"). */
export function formatMoneyText(decimal: string): string {
  const [whole = "0", fraction = "00"] = decimal.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${fraction}`;
}
