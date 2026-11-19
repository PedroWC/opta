import { afterAll, describe, expect, test } from "vitest";
import { CompareRegimesUseCase } from "../../src/application/compare-regimes-use-case.ts";
import { SimulateRegimesUseCase } from "../../src/application/simulate-regimes-use-case.ts";
import { UnsupportedActivityError } from "../../src/domain/errors/unsupported-activity-error.ts";
import type { TaxRateTableRepository } from "../../src/domain/ports/tax-rate-table-repository.ts";
import { LucroPresumido } from "../../src/domain/regimes/lucro-presumido.ts";
import { SimplesHibrido } from "../../src/domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";
import { SqlMigrator } from "../../src/infrastructure/sql/sql-migrator.ts";
import { SqlTaxRateTableRepository } from "../../src/infrastructure/sql/sql-tax-rate-table-repository.ts";
import { SqliteSqlExecutor } from "../../src/infrastructure/sql/sqlite-sql-executor.ts";

const sqliteExecutor = new SqliteSqlExecutor();
afterAll(() => sqliteExecutor.close());

const sqliteRepository = async (): Promise<TaxRateTableRepository> => {
  await new SqlMigrator(sqliteExecutor, "sqlite").migrate();
  return new SqlTaxRateTableRepository(sqliteExecutor);
};

/* Mesma suíte para todos os adaptadores da porta (ADR-0005): trocar o repositório não muda o domínio. */
describe.each<[string, () => Promise<TaxRateTableRepository>]>([
  ["em memória", async () => new InMemoryTaxRateTableRepository()],
  ["SQLite", sqliteRepository],
])("RNF-05: contrato do repositório de tabelas (%s)", (_name, create) => {
  test("RN-02: transição de 2026 (teste), 2029 (IBS 10%) e 2033 (pleno)", async () => {
    const repository = await create();
    const y2026 = await repository.transitionRatesFor(TaxYear.of(2026));
    expect([y2026.cbs.toString(), y2026.ibs.toString(), y2026.consumptionTestYear, y2026.pisCofinsExtinct]).toEqual([
      "0.9000%",
      "0.1000%",
      true,
      false,
    ]);
    const y2029 = await repository.transitionRatesFor(TaxYear.of(2029));
    expect([y2029.cbs.toString(), y2029.ibs.toString(), y2029.icmsIssPercentageInForce]).toEqual(["8.8000%", "1.7700%", 90]);
    const y2033 = await repository.transitionRatesFor(TaxYear.of(2033));
    expect([y2033.ibs.toString(), y2033.icmsIssPercentageInForce]).toEqual(["17.7000%", 0]);
  });

  test("RN-04: tabelas dos Anexos III e V (faixas, alíquotas e parcelas a deduzir)", async () => {
    const repository = await create();
    const three = await repository.simplesAnnexTableFor("III", TaxYear.of(2030));
    expect(three.brackets.map((b) => [b.upTo.toString(), b.nominalRate.toString(), b.deduction.toString()])).toEqual([
      ["180000.00", "6.0000%", "0.00"],
      ["360000.00", "11.2000%", "9360.00"],
      ["720000.00", "13.5000%", "17640.00"],
      ["1800000.00", "16.0000%", "35640.00"],
      ["3600000.00", "21.0000%", "125640.00"],
      ["4800000.00", "33.0000%", "648000.00"],
    ]);
    const five = await repository.simplesAnnexTableFor("V", TaxYear.of(2030));
    expect(five.brackets.map((b) => b.nominalRate.toString())).toEqual([
      "15.5000%",
      "18.0000%",
      "19.5000%",
      "20.5000%",
      "23.0000%",
      "30.5000%",
    ]);
  });

  test("RF-05: atividades por CNAE, busca paginada e regras de Simples e presunção", async () => {
    const repository = await create();
    const software = await repository.findActivity("6201-5/01");
    expect(software?.kind).toBe("SERVICE");
    expect(software?.simples?.usesPayrollFactor()).toBe(true);
    expect(software?.presumption.irpjRate.toString()).toBe("32.0000%");
    const retail = await repository.findActivity("4711-3/02");
    expect(retail?.simples).toBeNull();
    expect(retail?.presumption.csllRate.toString()).toBe("12.0000%");
    expect(await repository.findActivity("0111-3/01")).toBeNull();

    const page = await repository.searchActivities("computador", 1, 2);
    expect(page.items.map((a) => a.cnae)).toEqual(["6201-5/01", "6202-3/00"]);
    expect(page.hasNext).toBe(true);
    expect((await repository.searchActivities("ODONTOLOGICA", 1, 10)).items.map((a) => a.cnae)).toEqual(["8630-5/04"]);
  });

  test("RN-09: atividade sem regra de Simples ou fora do catálogo é rejeitada", async () => {
    const repository = await create();
    await expect(repository.simplesActivityFor("4711-3/02")).rejects.toBeInstanceOf(UnsupportedActivityError);
    await expect(repository.presumptionFor("0111-3/01")).rejects.toBeInstanceOf(UnsupportedActivityError);
  });

  test("RN-07: parâmetros do Lucro Presumido, PIS/Cofins cumulativo e versão das premissas", async () => {
    const repository = await create();
    const parameters = await repository.lucroPresumidoParametersFor(TaxYear.of(2026));
    expect(parameters.irpjRate.toString()).toBe("15.0000%");
    expect(parameters.irpjSurchargeRate.toString()).toBe("10.0000%");
    expect(parameters.surchargeAnnualThreshold().toString()).toBe("240000.00");
    expect(parameters.csllRate.toString()).toBe("9.0000%");
    expect(parameters.cppRate.toString()).toBe("20.0000%");
    expect((await repository.cumulativePisCofinsRate(TaxYear.of(2026))).toString()).toBe("3.6500%");
    expect(await repository.assumptionsVersion()).toBe("2026.1");
  });

  test("RF-03: a comparação dos três regimes dá os mesmos acumulados (193.920,00, 324.351,12 e 460.230,00)", async () => {
    const repository = await create();
    const company = new CompanyProfile({
      cnae: "8630-5/04",
      state: "SP",
      annualGrossRevenue: Money.fromText("300000"),
      annualPayroll: Money.fromText("0"),
      b2bPercentage: 50,
      creditablePurchasesPercentage: 40,
      icmsIssRate: TaxRate.fromPercentage("5"),
    });
    const comparison = await new CompareRegimesUseCase(
      new SimulateRegimesUseCase([new SimplesNacional(), new SimplesHibrido(), new LucroPresumido()], repository),
    ).execute(company);
    expect(comparison.cumulativeBurden("SIMPLES").toString()).toBe("193920.00");
    expect(comparison.cumulativeBurden("SIMPLES_HIBRIDO").toString()).toBe("324351.12");
    expect(comparison.cumulativeBurden("LUCRO_PRESUMIDO").toString()).toBe("460230.00");
  });
});
