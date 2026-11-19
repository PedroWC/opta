const NAMES: Readonly<Record<string, string>> = {
  DAS: "DAS (guia única do Simples)",
  IRPJ: "IRPJ",
  CSLL: "CSLL",
  CPP: "CPP (contribuição patronal sobre a folha)",
  PIS_COFINS: "PIS e Cofins",
  CBS: "CBS",
  IBS: "IBS",
  ICMS: "ICMS",
  ISS: "ISS",
  IRPJ_BASICO: "IRPJ básico",
  IRPJ_ADICIONAL: "IRPJ adicional",
  CBS_DEBITO: "CBS: débito (vendas)",
  CBS_CREDITO: "CBS: crédito (compras)",
  IBS_DEBITO: "IBS: débito (vendas)",
  IBS_CREDITO: "IBS: crédito (compras)",
  ICMS_DEBITO: "ICMS: débito (vendas)",
  ICMS_CREDITO: "ICMS: crédito (compras)",
};

/** Nome legível de um código de tributo da memória de cálculo; códigos novos aparecem como vieram. */
export function taxName(code: string): string {
  return NAMES[code] ?? code;
}
