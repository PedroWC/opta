import { InvalidInputError } from "../errors/invalid-input-error.ts";
import type { Money } from "./money.ts";
import { TaxRate } from "./tax-rate.ts";

export interface CompanyProfileData {
  cnae: string;
  state: string;
  annualGrossRevenue: Money;
  annualPayroll: Money;
  /** Parcela de vendas B2B, inteiro de 0 a 100 (%). */
  b2bPercentage: number;
  /** Compras que geram crédito de CBS/IBS, inteiro de 0 a 100 (% do faturamento). */
  creditablePurchasesPercentage: number;
  /** Alíquota de ICMS (comércio) ou ISS (serviços) informada pelo usuário; sem ela, assume 5%. */
  icmsIssRate?: TaxRate;
}

/** Entrada do simulador (RN-09: validada na construção). */
export class CompanyProfile {
  /** Teto legal do ISS (LC 116/2003); premissa quando o usuário não informa a alíquota. */
  private static readonly DEFAULT_ICMS_ISS_PERCENTAGE = "5";

  readonly cnae: string;
  readonly state: string;
  readonly annualGrossRevenue: Money;
  readonly annualPayroll: Money;
  readonly b2bPercentage: number;
  readonly creditablePurchasesPercentage: number;
  readonly icmsIssRate: TaxRate;

  constructor(data: CompanyProfileData) {
    if (!/^\d{4}-\d\/\d{2}$/.test(data.cnae)) throw new InvalidInputError(`CNAE inválido: ${data.cnae}`);
    if (data.annualGrossRevenue.isNegative()) throw new InvalidInputError("Receita bruta anual negativa.");
    if (data.annualPayroll.isNegative()) throw new InvalidInputError("Folha anual negativa.");
    CompanyProfile.requirePercentage("b2bPercentage", data.b2bPercentage);
    CompanyProfile.requirePercentage("creditablePurchasesPercentage", data.creditablePurchasesPercentage);
    this.cnae = data.cnae;
    this.state = data.state;
    this.annualGrossRevenue = data.annualGrossRevenue;
    this.annualPayroll = data.annualPayroll;
    this.b2bPercentage = data.b2bPercentage;
    this.creditablePurchasesPercentage = data.creditablePurchasesPercentage;
    this.icmsIssRate = data.icmsIssRate ?? TaxRate.fromPercentage(CompanyProfile.DEFAULT_ICMS_ISS_PERCENTAGE);
  }

  private static requirePercentage(field: string, value: number): void {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      throw new InvalidInputError(`${field} deve ser um inteiro entre 0 e 100.`);
    }
  }
}
