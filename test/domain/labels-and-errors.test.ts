import { describe, expect, test } from "vitest";
import { DecisiveFactor } from "../../src/domain/comparison/decisive-factor.ts";
import { Recommendation } from "../../src/domain/comparison/recommendation.ts";
import { EffectivePeriodNotFoundError } from "../../src/domain/errors/effective-period-not-found-error.ts";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { NotImplementedYetError } from "../../src/domain/errors/not-implemented-yet-error.ts";
import { ResourceNotFoundError } from "../../src/domain/errors/resource-not-found-error.ts";
import { SimplesLimitExceededError } from "../../src/domain/errors/simples-limit-exceeded-error.ts";
import { UnsupportedActivityError } from "../../src/domain/errors/unsupported-activity-error.ts";
import { CompanyProfile, type CompanyProfileData } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { CbsStrategy } from "../../src/domain/taxes/cbs-strategy.ts";
import { CppStrategy } from "../../src/domain/taxes/cpp-strategy.ts";
import { CsllStrategy } from "../../src/domain/taxes/csll-strategy.ts";
import { IbsStrategy } from "../../src/domain/taxes/ibs-strategy.ts";
import { IcmsStrategy } from "../../src/domain/taxes/icms-strategy.ts";
import { IssStrategy } from "../../src/domain/taxes/iss-strategy.ts";
import { PisCofinsStrategy } from "../../src/domain/taxes/pis-cofins-strategy.ts";
import type { TaxStrategy } from "../../src/domain/taxes/tax-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

describe("RF-03: rótulos e motivo da recomendação", () => {
  test("RF-03: cada categoria do fator decisivo tem um rótulo em português", () => {
    expect(new DecisiveFactor("INCOME_TAXES", Money.zero()).label()).toBe("tributos sobre a renda (IRPJ e CSLL)");
    expect(new DecisiveFactor("PAYROLL_CHARGES", Money.zero()).label()).toBe("encargos sobre a folha (CPP)");
    expect(new DecisiveFactor("CONSUMPTION_TAXES", Money.zero()).label()).toBe(
      "tributos sobre o consumo (CBS, IBS, ICMS, ISS e PIS/Cofins)",
    );
    expect(new DecisiveFactor("NONE", Money.zero()).label()).toBe("nenhum fator (regimes equivalentes)");
  });

  test("RF-03: o motivo cita o segundo colocado e o fator; sem concorrente, informa que há um só regime", () => {
    const factor = new DecisiveFactor("PAYROLL_CHARGES", Money.fromText("10.00"));
    expect(new Recommendation("A", Money.fromText("10.00"), factor, "B").reason).toBe(
      "Menor carga acumulada em 2026–2033 contra B; o que mais pesou: encargos sobre a folha (CPP).",
    );
    expect(new Recommendation("A", Money.zero(), new DecisiveFactor("NONE", Money.zero()), null).reason).toBe("Único regime simulado.");
  });
});

describe("RNF-07: erros tipados com código estável e mensagem útil", () => {
  test("RNF-07: códigos e mensagens dos erros de domínio", () => {
    expect(new InvalidInputError("x").code).toBe("SIM-001");
    const period = new EffectivePeriodNotFoundError("TABELA", 2030);
    expect([period.code, period.message]).toEqual(["SIM-002", "Não há parâmetros vigentes em TABELA para o ano 2030."]);
    const limit = new SimplesLimitExceededError("5000000.00", "4800000.00");
    expect([limit.code, limit.message]).toEqual(["SIM-003", "RBT12 de 5000000.00 acima do limite do Simples Nacional (4800000.00)."]);
    const activity = new UnsupportedActivityError("0111-3/01");
    expect([activity.code, activity.message]).toEqual([
      "SIM-004",
      "Atividade 0111-3/01 não suportada pelo simulador (escopo: serviços dos Anexos III e V).",
    ]);
    const missing = new ResourceNotFoundError("Atividade");
    expect([missing.code, missing.message]).toEqual(["SIM-005", "Atividade não encontrado."]);
    const pending = new NotImplementedYetError("algo");
    expect([pending.code, pending.message]).toEqual(["SIM-999", "Ainda não implementado: algo"]);
    expect(period.name).toBe("EffectivePeriodNotFoundError");
  });
});

describe("RN-09: o perfil da empresa rejeita entradas inválidas com mensagem clara", () => {
  const valid: CompanyProfileData = {
    cnae: "6201-5/01",
    state: "SP",
    annualGrossRevenue: Money.fromText("1000"),
    annualPayroll: Money.fromText("100"),
    b2bPercentage: 50,
    creditablePurchasesPercentage: 20,
  };
  const reject = (override: Partial<CompanyProfileData>): string => {
    try {
      new CompanyProfile({ ...valid, ...override });
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidInputError);
      return (error as Error).message;
    }
    return "";
  };

  test("RN-09: CNAE, receita, folha e percentuais fora do permitido", () => {
    expect(reject({ cnae: "123" })).toBe("CNAE inválido: 123");
    expect(reject({ annualGrossRevenue: Money.fromText("-1.00") })).toBe("Receita bruta anual negativa.");
    expect(reject({ annualPayroll: Money.fromText("-1.00") })).toBe("Folha anual negativa.");
    expect(reject({ b2bPercentage: 101 })).toBe("b2bPercentage deve ser um inteiro entre 0 e 100.");
    expect(reject({ b2bPercentage: -1 })).toBe("b2bPercentage deve ser um inteiro entre 0 e 100.");
    expect(reject({ b2bPercentage: 10.5 })).toBe("b2bPercentage deve ser um inteiro entre 0 e 100.");
    expect(reject({ creditablePurchasesPercentage: 101 })).toBe(
      "creditablePurchasesPercentage deve ser um inteiro entre 0 e 100.",
    );
  });

  test("RN-09: os limites 0 e 100 são aceitos", () => {
    expect(() => new CompanyProfile({ ...valid, b2bPercentage: 0, creditablePurchasesPercentage: 100 })).not.toThrow();
    expect(() => new CompanyProfile({ ...valid, b2bPercentage: 100, creditablePurchasesPercentage: 0 })).not.toThrow();
  });
});

describe("RF-06: cada estratégia cita a sua fonte legal e o seu código", () => {
  const context = new CalculationContext(
    new CompanyProfile({
      cnae: "6201-5/01",
      state: "SP",
      annualGrossRevenue: Money.fromText("100000"),
      annualPayroll: Money.fromText("30000"),
      b2bPercentage: 50,
      creditablePurchasesPercentage: 20,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(2027),
    new InMemoryTaxRateTableRepository(),
  );

  const cases: ReadonlyArray<[TaxStrategy, string, string]> = [
    [new CbsStrategy(), "CBS", "LC 214/2025"],
    [new IbsStrategy(), "IBS", "LC 214/2025"],
    [new IcmsStrategy(), "ICMS", "estadual"],
    [new IssStrategy(), "ISS", "LC 116/2003"],
    [new PisCofinsStrategy(), "PIS_COFINS", "10.637/2002"],
    [new CsllStrategy(), "CSLL", "Lei 9.249/1995"],
    [new CppStrategy(), "CPP", "Lei 8.212/1991"],
  ];

  test.each(cases)("RF-06: %o tem código %s e cita %s", async (strategy, code, source) => {
    const line = await strategy.calculate(context);
    expect(strategy.code).toBe(code);
    expect(line.code).toBe(code);
    expect(line.source).toContain(source);
  });

  test("RF-06: a base do CPP é a folha e a do CSLL é a receita presumida", async () => {
    expect((await new CppStrategy().calculate(context)).base.toString()).toBe("30000.00");
    expect((await new CsllStrategy().calculate(context)).base.toString()).toBe("32000.00");
  });

  test("RF-06: a memória do débito e do crédito leva o código com sufixo e a base de cada um", async () => {
    const line = await new CbsStrategy().calculate(context);
    expect(line.breakdown.map((part) => [part.code, part.base.toString()])).toEqual([
      ["CBS_DEBITO", "100000.00"],
      ["CBS_CREDITO", "20000.00"],
    ]);
  });
});
