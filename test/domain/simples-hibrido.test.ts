import { describe, expect, test } from "vitest";
import { SimplesHibrido } from "../../src/domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { EmbeddedCustomerCredit } from "../../src/domain/taxes/embedded-customer-credit.ts";
import { FullCustomerCredit } from "../../src/domain/taxes/full-customer-credit.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

/*
 * Empresa de referência (a mesma do caso golden A do Simples puro): Anexo III, RBT12 de 300.000,00,
 * compras creditáveis de 40% (120.000,00). DAS puro = 24.240,00 e partilha:
 *   IRPJ 969,60 | CSLL 848,40 | CPP 10.520,16 | PIS/Cofins 4.145,04 | ISS 7.756,80
 */
const contextFor = (year: number, b2b = 50): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae: "8630-5/04",
      state: "SP",
      annualGrossRevenue: Money.fromText("300000"),
      annualPayroll: Money.fromText("0"),
      b2bPercentage: b2b,
      creditablePurchasesPercentage: 40,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(year),
    new InMemoryTaxRateTableRepository(),
  );

const simulate = async (year: number) => {
  const result = await new SimplesHibrido().simulate(contextFor(year));
  return {
    lines: Object.fromEntries(result.lines.map((line) => [line.code, line.amount.toString()])),
    total: result.totalBurden().toString(),
  };
};

describe("RN-06: o Simples híbrido tira CBS/IBS do DAS e os apura no regime regular", () => {
  test("RN-06: 2026 mantém o DAS inteiro (PIS/Cofins e ISS vigentes) e CBS/IBS de teste são compensados", async () => {
    const { lines, total } = await simulate(2026);
    expect(lines).toEqual({ DAS: "24240.00", CBS: "0.00", IBS: "0.00" });
    expect(total).toBe("24240.00");
  });

  test("RN-06: 2027 tira do DAS a parcela da CBS (4.145,04) e apura CBS (26.400 - 10.560) e IBS (300 - 120)", async () => {
    const { lines, total } = await simulate(2027);
    expect(lines).toEqual({ DAS: "20094.96", CBS: "15840.00", IBS: "180.00" });
    expect(total).toBe("36114.96");
  });

  test("RN-06: 2029 tira também a parcela do ISS substituída pelo IBS (775,68), e o IBS regular é de 1,77%", async () => {
    const { lines, total } = await simulate(2029);
    expect(lines).toEqual({ DAS: "19319.28", CBS: "15840.00", IBS: "3186.00" });
    expect(total).toBe("38345.28");
  });

  test("RN-06: 2033 deixa no DAS só IRPJ, CSLL e CPP (12.338,16) e o IBS regular é pleno", async () => {
    const { lines, total } = await simulate(2033);
    expect(lines).toEqual({ DAS: "12338.16", CBS: "15840.00", IBS: "31860.00" });
    expect(total).toBe("60038.16");
  });

  test("RN-06: a memória do DAS híbrido lista só as parcelas que continuam nele", async () => {
    const result = await new SimplesHibrido().simulate(contextFor(2027));
    const das = result.lines.find((line) => line.code === "DAS");
    expect(das?.breakdown.map((part) => part.code)).toEqual(["IRPJ", "CSLL", "CPP", "ISS"]);
    expect(das?.source).toContain("RN-06");
  });

  test("RN-06: o híbrido é um Simples e o regime puro continua inalterado", async () => {
    expect(new SimplesHibrido()).toBeInstanceOf(SimplesNacional);
    const pure = await new SimplesNacional().simulate(contextFor(2033));
    expect(pure.totalBurden().toString()).toBe("24240.00");
  });
});

describe("RN-10: crédito de CBS/IBS gerado ao cliente B2B", () => {
  test("RN-10: no Simples puro o crédito se limita ao CBS/IBS embutido no DAS (2033: 4.145,04 + 7.756,80)", async () => {
    const credit = await new EmbeddedCustomerCredit().creditFor(contextFor(2033, 100));
    expect(credit.toString()).toBe("11901.84");
  });

  test("RN-10: no híbrido o crédito é integral (2033: 300.000 x (8,8% + 17,7%))", async () => {
    const credit = await new FullCustomerCredit().creditFor(contextFor(2033, 100));
    expect(credit.toString()).toBe("79500.00");
  });

  test("RN-10: 2027 compara 4.145,04 (embutido) com 26.700,00 (integral, 8,8% + 0,1%)", async () => {
    expect((await new EmbeddedCustomerCredit().creditFor(contextFor(2027, 100))).toString()).toBe("4145.04");
    expect((await new FullCustomerCredit().creditFor(contextFor(2027, 100))).toString()).toBe("26700.00");
  });

  test("RN-10: só as vendas B2B geram crédito (50% => metade)", async () => {
    expect((await new FullCustomerCredit().creditFor(contextFor(2033, 50))).toString()).toBe("39750.00");
    expect((await new EmbeddedCustomerCredit().creditFor(contextFor(2033, 50))).toString()).toBe("5950.92");
  });

  test("RN-10: sem vendas B2B não há crédito", async () => {
    expect((await new FullCustomerCredit().creditFor(contextFor(2033, 0))).toString()).toBe("0.00");
    expect((await new EmbeddedCustomerCredit().creditFor(contextFor(2033, 0))).toString()).toBe("0.00");
  });
});
