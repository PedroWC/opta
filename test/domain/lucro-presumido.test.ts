import { describe, expect, test } from "vitest";
import { UnsupportedActivityError } from "../../src/domain/errors/unsupported-activity-error.ts";
import { LucroPresumido } from "../../src/domain/regimes/lucro-presumido.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

const contextFor = (cnae: string, revenue: string, payroll: string, year: number): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae,
      state: "SP",
      annualGrossRevenue: Money.fromText(revenue),
      annualPayroll: Money.fromText(payroll),
      b2bPercentage: 50,
      creditablePurchasesPercentage: 40,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(year),
    new InMemoryTaxRateTableRepository(),
  );

const simulate = async (cnae: string, revenue: string, payroll: string, year: number) => {
  const result = await new LucroPresumido().simulate(contextFor(cnae, revenue, payroll, year));
  return {
    lines: Object.fromEntries(result.lines.map((line) => [line.code, line.amount.toString()])),
    total: result.totalBurden().toString(),
  };
};

/*
 * Caso golden de serviços (CNAE 6201-5/01): receita 1.200.000,00; folha 300.000,00; compras 40%; ISS 5%.
 *   Base presumida 32% = 384.000,00.
 *   IRPJ = 15% x 384.000 + 10% x (384.000 - 240.000) = 57.600 + 14.400 = 72.000,00
 *   CSLL = 9% x 384.000 = 34.560,00      CPP = 20% x 300.000 = 60.000,00
 *   PIS/Cofins (2026) = 3,65% x 1.200.000 = 43.800,00      ISS = 5% x 1.200.000 = 60.000,00
 *   CBS: 8,8% -> débito 105.600 - crédito 42.240 (compras 480.000) = 63.360,00
 *   IBS 2027: 0,1% -> 1.200 - 480 = 720,00      IBS 2033: 17,7% -> 212.400 - 84.960 = 127.440,00
 */
describe("RN-07: Lucro Presumido de serviços (golden)", () => {
  test("RN-07: 2026 soma IRPJ, CSLL, CPP, PIS/Cofins e ISS; CBS/IBS de teste são compensados", async () => {
    const { lines, total } = await simulate("6201-5/01", "1200000", "300000", 2026);
    expect(lines).toEqual({
      IRPJ: "72000.00",
      CSLL: "34560.00",
      CPP: "60000.00",
      PIS_COFINS: "43800.00",
      CBS: "0.00",
      IBS: "0.00",
      ISS: "60000.00",
    });
    expect(total).toBe("270360.00");
  });

  test("RN-07: 2027 troca PIS/Cofins por CBS e IBS de 0,1%", async () => {
    const { lines, total } = await simulate("6201-5/01", "1200000", "300000", 2027);
    expect(lines).toMatchObject({ PIS_COFINS: "0.00", CBS: "63360.00", IBS: "720.00", ISS: "60000.00" });
    expect(total).toBe("290640.00");
  });

  test("RN-02/RN-07: 2033 tem IBS pleno e ISS extinto", async () => {
    const { lines, total } = await simulate("6201-5/01", "1200000", "300000", 2033);
    expect(lines).toMatchObject({ CBS: "63360.00", IBS: "127440.00", ISS: "0.00" });
    expect(total).toBe("357360.00");
  });
});

/*
 * Caso golden de comércio (CNAE 4711-3/02): receita 1.200.000,00; folha 120.000,00; compras 40%; ICMS 5%.
 *   IRPJ: base 8% = 96.000 -> 15% = 14.400 (abaixo de 240.000, sem adicional)
 *   CSLL: base 12% = 144.000 -> 9% = 12.960      CPP = 20% x 120.000 = 24.000
 *   ICMS (2026) = 60.000 - 24.000 = 36.000      PIS/Cofins = 43.800
 */
describe("RN-07: Lucro Presumido de comércio (golden)", () => {
  test("RN-07: 2026 usa presunção de 8% e 12% e ICMS no lugar do ISS", async () => {
    const { lines, total } = await simulate("4711-3/02", "1200000", "120000", 2026);
    expect(lines).toEqual({
      IRPJ: "14400.00",
      CSLL: "12960.00",
      CPP: "24000.00",
      PIS_COFINS: "43800.00",
      CBS: "0.00",
      IBS: "0.00",
      ICMS: "36000.00",
    });
    expect(total).toBe("131160.00");
  });
});

describe("RN-07: adicional de IRPJ", () => {
  test("RN-07: base presumida de exatamente 240.000,00 (R$ 20 mil/mês) não paga adicional: IRPJ de 36.000,00", async () => {
    const { lines } = await simulate("6201-5/01", "750000", "0", 2026);
    expect(lines.IRPJ).toBe("36000.00");
  });

  test("RN-07: a memória do IRPJ separa o básico e o adicional", async () => {
    const result = await new LucroPresumido().simulate(contextFor("6201-5/01", "1200000", "300000", 2026));
    const irpj = result.lines.find((line) => line.code === "IRPJ");
    expect(irpj?.breakdown.map((part) => [part.code, part.amount.toString()])).toEqual([
      ["IRPJ_BASICO", "57600.00"],
      ["IRPJ_ADICIONAL", "14400.00"],
    ]);
    expect(irpj?.base.toString()).toBe("384000.00");
  });

  test("RN-07: sem receita todos os tributos próprios são zero", async () => {
    const { total } = await simulate("6201-5/01", "0", "0", 2026);
    expect(total).toBe("0.00");
  });

  test("RN-09: atividade fora do escopo é rejeitada", async () => {
    await expect(simulate("0111-3/01", "1000", "0", 2026)).rejects.toBeInstanceOf(UnsupportedActivityError);
  });
});
