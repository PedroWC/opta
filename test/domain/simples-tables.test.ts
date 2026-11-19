import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { SimplesLimitExceededError } from "../../src/domain/errors/simples-limit-exceeded-error.ts";
import type { TaxRateTableRepository } from "../../src/domain/ports/tax-rate-table-repository.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { DasPartition } from "../../src/domain/simples/das-partition.ts";
import { FatorR } from "../../src/domain/simples/fator-r.ts";
import { FixedAnnexActivity, PayrollFactorActivity, type SimplesActivity } from "../../src/domain/simples/simples-activity.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

const repository: TaxRateTableRepository = new InMemoryTaxRateTableRepository();

describe("RN-05: Fator R = folha dos 12 meses / RBT12", () => {
  test("RN-05: a partir de 28% atinge o limite", () => {
    expect(FatorR.of(Money.fromText("28"), Money.fromText("100")).reachesThreshold()).toBe(true);
    expect(FatorR.of(Money.fromText("27.99"), Money.fromText("100")).reachesThreshold()).toBe(false);
  });

  test("RN-05: sem receita o Fator R não é atingido e vale 0%", () => {
    const factor = FatorR.of(Money.fromText("10"), Money.zero());
    expect(factor.reachesThreshold()).toBe(false);
    expect(factor.toTaxRate().toString()).toBe("0.0000%");
  });

  test("RN-05: o valor exibido tem 4 casas, meio para cima (1/3 = 33,3333%)", () => {
    expect(FatorR.of(Money.fromText("1"), Money.fromText("3")).toTaxRate().toString()).toBe("33.3333%");
  });

  test("RN-05: atividade com Fator R muda de Anexo V para III; a fixa não muda", () => {
    const high = FatorR.of(Money.fromText("30"), Money.fromText("100"));
    const low = FatorR.of(Money.fromText("10"), Money.fromText("100"));
    expect(new PayrollFactorActivity().annexFor(high)).toBe("III");
    expect(new PayrollFactorActivity().annexFor(low)).toBe("V");
    const fixed: SimplesActivity = new FixedAnnexActivity("III");
    expect(fixed.annexFor(low)).toBe("III");
  });
});

describe("RN-04: tabelas de referência do Simples (LC 123/2006) ⚠️", () => {
  const limits = ["180000", "360000", "720000", "1800000", "3600000", "4800000"];
  const nominalIII = ["6.0000%", "11.2000%", "13.5000%", "16.0000%", "21.0000%", "33.0000%"];
  const nominalV = ["15.5000%", "18.0000%", "19.5000%", "20.5000%", "23.0000%", "30.5000%"];
  const deductionIII = ["0", "9360", "17640", "35640", "125640", "648000"];
  const deductionV = ["0", "4500", "9900", "17100", "62100", "540000"];

  test("RN-04: Anexo III tem as 6 faixas, alíquotas e parcelas a deduzir esperadas", async () => {
    const table = await repository.simplesAnnexTableFor("III", TaxYear.of(2026));
    expect(table.brackets.map((b) => b.upTo.toString())).toEqual(limits.map((l) => `${l}.00`));
    expect(table.brackets.map((b) => b.nominalRate.toString())).toEqual(nominalIII);
    expect(table.brackets.map((b) => b.deduction.toString())).toEqual(deductionIII.map((d) => `${d}.00`));
  });

  test("RN-04: Anexo V tem as 6 faixas, alíquotas e parcelas a deduzir esperadas", async () => {
    const table = await repository.simplesAnnexTableFor("V", TaxYear.of(2026));
    expect(table.brackets.map((b) => b.upTo.toString())).toEqual(limits.map((l) => `${l}.00`));
    expect(table.brackets.map((b) => b.nominalRate.toString())).toEqual(nominalV);
    expect(table.brackets.map((b) => b.deduction.toString())).toEqual(deductionV.map((d) => `${d}.00`));
  });

  test("RN-04: toda partilha soma 100% e a tabela vale para os 8 anos", async () => {
    for (const taxYear of TaxYear.horizon()) {
      for (const annex of ["III", "V"] as const) {
        const table = await repository.simplesAnnexTableFor(annex, taxYear);
        expect(table.brackets).toHaveLength(6);
      }
    }
  });

  test("RN-04: faixa de uma RBT12 acima do teto lança erro tipado", async () => {
    const table = await repository.simplesAnnexTableFor("III", TaxYear.of(2026));
    expect(() => table.bracketFor(Money.fromText("4800000.01"))).toThrow(SimplesLimitExceededError);
  });
});

describe("RN-04: partilha do DAS", () => {
  const shares = (values: [string, string, string, string, string, string]): DasPartition =>
    new DasPartition({
      IRPJ: TaxRate.fromPercentage(values[0]),
      CSLL: TaxRate.fromPercentage(values[1]),
      COFINS: TaxRate.fromPercentage(values[2]),
      PIS: TaxRate.fromPercentage(values[3]),
      CPP: TaxRate.fromPercentage(values[4]),
      ISS: TaxRate.fromPercentage(values[5]),
    });

  test("RN-04: partilha que não soma 100% é rejeitada", () => {
    expect(() => shares(["4", "3.5", "12.82", "2.78", "43.4", "30"])).toThrow(InvalidInputError);
  });

  test("RN-03: a diferença de arredondamento fica na maior parcela e a soma bate com o DAS", () => {
    const partition = shares(["33.3333", "33.3333", "33.3334", "0", "0", "0"]);
    const parts = partition.split(Money.fromText("0.05"));
    const sum = Object.values(parts).reduce((total, part) => total.add(part), Money.zero());
    expect(sum.toString()).toBe("0.05");
    expect(parts.COFINS.toString()).toBe("0.01");
    expect(parts.PIS.isNegative()).toBe(false);
  });
});
