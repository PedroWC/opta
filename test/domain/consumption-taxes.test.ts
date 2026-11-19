import { describe, expect, test } from "vitest";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { CbsStrategy } from "../../src/domain/taxes/cbs-strategy.ts";
import { IbsStrategy } from "../../src/domain/taxes/ibs-strategy.ts";
import { IcmsStrategy } from "../../src/domain/taxes/icms-strategy.ts";
import { IssStrategy } from "../../src/domain/taxes/iss-strategy.ts";
import { PisCofinsStrategy } from "../../src/domain/taxes/pis-cofins-strategy.ts";
import type { TaxStrategy } from "../../src/domain/taxes/tax-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

/*
 * Empresa de referência: receita de 1.000.000,00, compras creditáveis de 40% (400.000,00 por ano),
 * ICMS/ISS de 5%. Todos os valores esperados foram calculados à mão.
 */
const contextFor = (year: number, purchases = 40): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae: "6201-5/01",
      state: "SP",
      annualGrossRevenue: Money.fromText("1000000"),
      annualPayroll: Money.fromText("300000"),
      b2bPercentage: 50,
      creditablePurchasesPercentage: purchases,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(year),
    new InMemoryTaxRateTableRepository(),
  );

const amount = async (strategy: TaxStrategy, year: number, purchases = 40): Promise<string> =>
  (await strategy.calculate(contextFor(year, purchases))).amount.toString();

describe("RN-02: CBS é débito menos crédito (alíquota de referência de 8,8%)", () => {
  test.each([
    [2027, "52800.00"], // 88.000,00 - 35.200,00
    [2028, "52800.00"],
    [2033, "52800.00"],
  ])("RN-02: CBS de %i = %s", async (year, expected) => {
    expect(await amount(new CbsStrategy(), year)).toBe(expected);
  });

  test("RN-02: a memória mostra débito (88.000,00) e crédito (35.200,00)", async () => {
    const line = await new CbsStrategy().calculate(contextFor(2027));
    expect(line.breakdown.map((part) => [part.code, part.amount.toString()])).toEqual([
      ["CBS_DEBITO", "88000.00"],
      ["CBS_CREDITO", "35200.00"],
    ]);
    expect(line.rate.toString()).toBe("8.8000%");
  });

  test("RN-02: em 2026 (teste de 0,9%) o valor é compensado e a carga é zero, mas a memória é mantida", async () => {
    const line = await new CbsStrategy().calculate(contextFor(2026));
    expect(line.amount.toString()).toBe("0.00");
    expect(line.breakdown.map((part) => part.amount.toString())).toEqual(["9000.00", "3600.00"]);
  });

  test("RN-02: com 100% de compras creditáveis o crédito zera o débito (nunca fica negativo)", async () => {
    expect(await amount(new CbsStrategy(), 2027, 100)).toBe("0.00");
  });
});

describe("RN-02: IBS cresce 10/20/30/40% da referência (17,7%) de 2029 a 2032 e é pleno em 2033", () => {
  test.each([
    [2026, "0.00"], // teste de 0,1%, compensado
    [2027, "600.00"], // 0,1%: 1.000,00 - 400,00
    [2028, "600.00"],
    [2029, "10620.00"], // 1,77%: 17.700,00 - 7.080,00
    [2030, "21240.00"], // 3,54%
    [2031, "31860.00"], // 5,31%
    [2032, "42480.00"], // 7,08%
    [2033, "106200.00"], // 17,7%: 177.000,00 - 70.800,00
  ])("RN-02: IBS de %i = %s", async (year, expected) => {
    expect(await amount(new IbsStrategy(), year)).toBe(expected);
  });
});

describe("RN-02: PIS/Cofins cumulativos (3,65%) só até 2026", () => {
  test("RN-02: 2026 cobra 36.500,00", async () => {
    expect(await amount(new PisCofinsStrategy(), 2026)).toBe("36500.00");
  });

  test.each([2027, 2028, 2033])("RN-02: %i não cobra PIS/Cofins", async (year) => {
    expect(await amount(new PisCofinsStrategy(), year)).toBe("0.00");
  });
});

describe("RN-02: ISS (cumulativo) e ICMS (não cumulativo) cedem ao IBS (90/80/70/60% e extinção em 2033)", () => {
  test.each([
    [2026, "50000.00"],
    [2028, "50000.00"],
    [2029, "45000.00"],
    [2030, "40000.00"],
    [2031, "35000.00"],
    [2032, "30000.00"],
    [2033, "0.00"],
  ])("RN-02: ISS de %i = %s", async (year, expected) => {
    expect(await amount(new IssStrategy(), year)).toBe(expected);
  });

  test.each([
    [2026, "30000.00"], // 50.000,00 - 20.000,00
    [2029, "27000.00"], // 45.000,00 - 18.000,00
    [2032, "18000.00"], // 30.000,00 - 12.000,00
    [2033, "0.00"],
  ])("RN-02: ICMS de %i = %s", async (year, expected) => {
    expect(await amount(new IcmsStrategy(), year)).toBe(expected);
  });

  test("RN-02: a alíquota informada de 5% é reduzida pela fração vigente (90% em 2029 = 4,5%)", async () => {
    const line = await new IssStrategy().calculate(contextFor(2029));
    expect(line.rate.toString()).toBe("4.5000%");
  });
});

describe("RN-09: alíquota de ICMS/ISS informada", () => {
  test("RN-09: sem informar, assume o teto de ISS de 5% (premissa documentada)", () => {
    const profile = new CompanyProfile({
      cnae: "6201-5/01",
      state: "SP",
      annualGrossRevenue: Money.zero(),
      annualPayroll: Money.zero(),
      b2bPercentage: 0,
      creditablePurchasesPercentage: 0,
    });
    expect(profile.icmsIssRate.toString()).toBe("5.0000%");
  });
});
