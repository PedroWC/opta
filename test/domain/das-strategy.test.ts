import { describe, expect, test } from "vitest";
import { SimplesLimitExceededError } from "../../src/domain/errors/simples-limit-exceeded-error.ts";
import { UnsupportedActivityError } from "../../src/domain/errors/unsupported-activity-error.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { DasStrategy } from "../../src/domain/taxes/das-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

const contextFor = (cnae: string, revenue: string, payroll: string, year: number): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae,
      state: "SP",
      annualGrossRevenue: Money.fromText(revenue),
      annualPayroll: Money.fromText(payroll),
      b2bPercentage: 0,
      creditablePurchasesPercentage: 0,
    }),
    TaxYear.of(year),
    new InMemoryTaxRateTableRepository(),
  );

const das = (cnae: string, revenue: string, payroll: string, year = 2026) =>
  new DasStrategy().calculate(contextFor(cnae, revenue, payroll, year));

const breakdownOf = (line: { breakdown: readonly { code: string; amount: Money }[] }): Record<string, string> =>
  Object.fromEntries(line.breakdown.map((part) => [part.code, part.amount.toString()]));

/*
 * Caso golden A (conferido à mão): Anexo III, RBT12 = 300.000,00 (2ª faixa: 11,2% e PD 9.360).
 * Alíquota efetiva = (300000 x 0,112 - 9360) / 300000 = 24240 / 300000 = 8,08%. DAS = 24.240,00.
 * Partilha da 2ª faixa: IRPJ 4%, CSLL 3,5%, Cofins 14,05%, PIS 3,05%, CPP 43,4%, ISS 32%.
 *   IRPJ 969,60 | CSLL 848,40 | Cofins 3.405,72 | PIS 739,32 | CPP 10.520,16 | ISS 7.756,80
 * Na transição, PIS+Cofins (4.145,04) vira CBS a partir de 2027, e o ISS (7.756,80) cede ao IBS
 * a fração que deixa de vigorar (10% em 2029, 20%, 30%, 40% e 100% em 2033).
 */
describe("RN-04: alíquota efetiva e DAS (caso golden A, Anexo III, RBT12 de 300 mil)", () => {
  test("RN-04: alíquota efetiva de 8,0800% e DAS de 24.240,00", async () => {
    const line = await das("8630-5/04", "300000.00", "0");
    expect(line.code).toBe("DAS");
    expect(line.rate.toString()).toBe("8.0800%");
    expect(line.amount.toString()).toBe("24240.00");
    expect(line.base.toString()).toBe("300000.00");
    expect(line.source).toContain("Anexo III");
  });

  const expectedByYear: ReadonlyArray<[number, Record<string, string>]> = [
    [2026, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", PIS_COFINS: "4145.04", ISS: "7756.80" }],
    [2027, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "7756.80" }],
    [2028, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "7756.80" }],
    [2029, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "6981.12", IBS: "775.68" }],
    [2030, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "6205.44", IBS: "1551.36" }],
    [2031, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "5429.76", IBS: "2327.04" }],
    [2032, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", ISS: "4654.08", IBS: "3102.72" }],
    [2033, { IRPJ: "969.60", CSLL: "848.40", CPP: "10520.16", CBS: "4145.04", IBS: "7756.80" }],
  ];

  test.each(expectedByYear)("RN-02/RN-04: partilha do DAS em %i (golden)", async (year, expected) => {
    const line = await das("8630-5/04", "300000.00", "0", year);
    expect(breakdownOf(line)).toEqual(expected);
    expect(line.amount.toString()).toBe("24240.00");
  });

  test("RN-04: a soma da partilha é sempre igual ao DAS, em todos os anos", async () => {
    for (const taxYear of TaxYear.horizon()) {
      const line = await das("8630-5/04", "300000.00", "0", taxYear.year);
      const sum = line.breakdown.reduce((total, part) => total.add(part.amount), Money.zero());
      expect(sum.equals(line.amount)).toBe(true);
    }
  });
});

describe("RN-05: Fator R decide entre os Anexos III e V (caso golden B, RBT12 de 600 mil)", () => {
  test("RN-05: Fator R de exatamente 28% usa o Anexo III (13,5% e PD 17.640): efetiva 10,5600%, DAS 63.360,00", async () => {
    const line = await das("6201-5/01", "600000.00", "168000.00");
    expect(line.source).toContain("Anexo III");
    expect(line.rate.toString()).toBe("10.5600%");
    expect(line.amount.toString()).toBe("63360.00");
  });

  test("RN-05: Fator R abaixo de 28% usa o Anexo V (19,5% e PD 9.900): efetiva 17,8500%, DAS 107.100,00", async () => {
    const line = await das("6201-5/01", "600000.00", "167999.99");
    expect(line.source).toContain("Anexo V");
    expect(line.rate.toString()).toBe("17.8500%");
    expect(line.amount.toString()).toBe("107100.00");
  });

  test("RN-04: partilha do Anexo V, 3ª faixa (golden)", async () => {
    const line = await das("6201-5/01", "600000.00", "167999.99");
    expect(breakdownOf(line)).toEqual({
      IRPJ: "25704.00",
      CSLL: "16065.00",
      CPP: "25543.35",
      PIS_COFINS: "19438.65",
      ISS: "20349.00",
    });
  });

  test("RN-05: atividade de Anexo III fixo ignora o Fator R", async () => {
    const line = await das("8630-5/04", "600000.00", "0");
    expect(line.source).toContain("Anexo III");
    expect(line.amount.toString()).toBe("63360.00");
  });
});

describe("RN-04: faixas, limites e arredondamento", () => {
  test("RN-04: o limite superior da faixa pertence a ela (180.000,00 ainda é a 1ª faixa, 6%)", async () => {
    const line = await das("8630-5/04", "180000.00", "0");
    expect(line.rate.toString()).toBe("6.0000%");
    expect(line.amount.toString()).toBe("10800.00");
    expect(line.source).toContain("1ª faixa");
  });

  test("RN-04: limite do Simples (4.800.000,00) é aceito na 6ª faixa: efetiva 19,5000%, DAS 936.000,00", async () => {
    const line = await das("8630-5/04", "4800000.00", "0");
    expect(line.rate.toString()).toBe("19.5000%");
    expect(line.amount.toString()).toBe("936000.00");
    expect(breakdownOf(line)).toEqual({
      IRPJ: "327600.00",
      CSLL: "140400.00",
      CPP: "285480.00",
      PIS_COFINS: "182520.00",
    });
  });

  test("RN-03/RN-04: a alíquota efetiva usa 4 casas, meio para cima (RBT12 de 333.333,33)", async () => {
    const line = await das("8630-5/04", "333333.33", "0");
    expect(line.rate.toString()).toBe("8.3920%");
    expect(line.amount.toString()).toBe("27973.33");
  });

  test("RN-04: acima do limite de 4.800.000,00 o Simples não se aplica", async () => {
    await expect(das("8630-5/04", "4800000.01", "0")).rejects.toBeInstanceOf(SimplesLimitExceededError);
  });

  test("RN-04: sem receita não há DAS nem memória de partilha", async () => {
    const line = await das("8630-5/04", "0", "0");
    expect(line.amount.toString()).toBe("0.00");
    expect(line.rate.toString()).toBe("0.0000%");
    expect(line.breakdown).toEqual([]);
  });

  test("RN-09: atividade fora do escopo do MVP é rejeitada com erro tipado", async () => {
    await expect(das("4711-3/02", "300000.00", "0")).rejects.toBeInstanceOf(UnsupportedActivityError);
  });
});

describe("RF-01/RF-02: o regime Simples Nacional soma o DAS", () => {
  test("RF-02: a carga total do Simples em 2026 é o DAS (24.240,00) e a memória tem uma linha", async () => {
    const result = await new SimplesNacional().simulate(contextFor("8630-5/04", "300000.00", "0", 2026));
    expect(result.regime).toBe("SIMPLES");
    expect(result.lines.map((l) => l.code)).toEqual(["DAS"]);
    expect(result.totalBurden().toString()).toBe("24240.00");
  });

  test("RF-02: o DAS total é igual nos 8 anos (a transição muda só a composição)", async () => {
    for (const taxYear of TaxYear.horizon()) {
      const result = await new SimplesNacional().simulate(contextFor("8630-5/04", "300000.00", "0", taxYear.year));
      expect(result.totalBurden().toString()).toBe("24240.00");
    }
  });
});
