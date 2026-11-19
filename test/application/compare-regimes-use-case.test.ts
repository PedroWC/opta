import { describe, expect, test } from "vitest";
import { CompareRegimesUseCase } from "../../src/application/compare-regimes-use-case.ts";
import { SimulateRegimesUseCase } from "../../src/application/simulate-regimes-use-case.ts";
import { LucroPresumido } from "../../src/domain/regimes/lucro-presumido.ts";
import { SimplesHibrido } from "../../src/domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

/*
 * Empresa de referência: CNAE 8630-5/04, receita de 300.000,00, sem folha, compras creditáveis de 40%, ISS 5%.
 * Carga por ano (conferida à mão):
 *   Simples puro:   24.240,00 em todos os anos                                  => acumulado 193.920,00
 *   Simples híbrido: 24.240,00 | 36.114,96 | 36.114,96 | 38.345,28 | 40.755,60 |
 *                    43.165,92 | 45.576,24 | 60.038,16                          => acumulado 324.351,12
 *   Lucro Presumido: 48.990 | 54.060 | 54.060 | 55.566 | 57.252 | 58.938 | 60.624 | 70.740 => acumulado 460.230,00
 */
describe("RF-03 e RN-08: comparação dos três regimes em 2026–2033 (golden)", () => {
  const company = new CompanyProfile({
    cnae: "8630-5/04",
    state: "SP",
    annualGrossRevenue: Money.fromText("300000"),
    annualPayroll: Money.fromText("0"),
    b2bPercentage: 50,
    creditablePurchasesPercentage: 40,
    icmsIssRate: TaxRate.fromPercentage("5"),
  });
  const rateTables = new InMemoryTaxRateTableRepository();
  const useCase = new CompareRegimesUseCase(
    new SimulateRegimesUseCase([new SimplesNacional(), new SimplesHibrido(), new LucroPresumido()], rateTables),
  );

  test("RN-08: a carga acumulada de cada regime", async () => {
    const comparison = await useCase.execute(company);
    expect(comparison.cumulativeBurden("SIMPLES").toString()).toBe("193920.00");
    expect(comparison.cumulativeBurden("SIMPLES_HIBRIDO").toString()).toBe("324351.12");
    expect(comparison.cumulativeBurden("LUCRO_PRESUMIDO").toString()).toBe("460230.00");
  });

  test("RN-08: o Simples puro vence todos os anos (carga de 24.240,00)", async () => {
    const comparison = await useCase.execute(company);
    for (const taxYear of TaxYear.horizon()) expect(comparison.bestInYear(taxYear)).toBe("SIMPLES");
  });

  test("RF-03: recomenda o Simples puro, economia acumulada de 130.431,12 sobre o híbrido, decidida pelo consumo", async () => {
    const recommendation = (await useCase.execute(company)).recommendation();
    expect(recommendation.regime).toBe("SIMPLES");
    expect(recommendation.cumulativeSavings.toString()).toBe("130431.12");
    expect(recommendation.decisiveFactor.code).toBe("CONSUMPTION_TAXES");
    expect(recommendation.decisiveFactor.difference.toString()).toBe("130431.12");
    expect(recommendation.reason.length).toBeGreaterThan(0);
  });
});
