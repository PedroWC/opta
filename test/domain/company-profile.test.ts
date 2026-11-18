import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { CompanyProfile, type CompanyProfileData } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";

const valid = (): CompanyProfileData => ({
  cnae: "6201-5/01",
  state: "SP",
  annualGrossRevenue: Money.fromText("1800000"),
  annualPayroll: Money.fromText("540000"),
  b2bPercentage: 70,
  creditablePurchasesPercentage: 25,
});

describe("RN-09: validação da entrada da empresa", () => {
  test("RN-09: aceita uma entrada válida", () => {
    expect(new CompanyProfile(valid()).cnae).toBe("6201-5/01");
  });

  test("RN-09: rejeita CNAE malformado", () => {
    expect(() => new CompanyProfile({ ...valid(), cnae: "620150" })).toThrow(InvalidInputError);
  });

  test("RN-09: rejeita percentual fora de 0–100", () => {
    expect(() => new CompanyProfile({ ...valid(), b2bPercentage: 101 })).toThrow(InvalidInputError);
  });

  test("RN-09: rejeita receita negativa", () => {
    expect(() => new CompanyProfile({ ...valid(), annualGrossRevenue: Money.fromText("-1") })).toThrow(InvalidInputError);
  });
});
