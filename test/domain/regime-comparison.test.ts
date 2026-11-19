import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { AnnualResult } from "../../src/domain/regimes/annual-result.ts";
import { RegimeComparison } from "../../src/domain/comparison/regime-comparison.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { TaxLine } from "../../src/domain/taxes/tax-line.ts";

const line = (code: string, amount: string, breakdown: TaxLine[] = []): TaxLine =>
  new TaxLine(code, Money.zero(), TaxRate.zero(), Money.fromText(amount), "teste", breakdown);

const result = (regime: string, year: number, lines: TaxLine[]): AnnualResult =>
  new AnnualResult(regime, TaxYear.of(year), lines);

/** Regime com uma só linha por ano, para testar o comparador sem depender dos cálculos fiscais. */
const flat = (regime: string, code: string, amounts: Record<number, string>): AnnualResult[] =>
  Object.entries(amounts).map(([year, amount]) => result(regime, Number(year), [line(code, amount)]));

describe("RN-08: menor carga no ano e acumulada", () => {
  const results = [
    ...flat("A", "IRPJ", { 2026: "100.00", 2027: "300.00" }),
    ...flat("B", "CBS", { 2026: "200.00", 2027: "150.00" }),
  ];

  test("RN-08: o melhor regime de cada ano é o de menor carga naquele ano", () => {
    const comparison = new RegimeComparison(results);
    expect(comparison.bestInYear(TaxYear.of(2026))).toBe("A");
    expect(comparison.bestInYear(TaxYear.of(2027))).toBe("B");
  });

  test("RN-08: a carga acumulada soma os anos (A = 400, B = 350)", () => {
    const comparison = new RegimeComparison(results);
    expect(comparison.cumulativeBurden("A").toString()).toBe("400.00");
    expect(comparison.cumulativeBurden("B").toString()).toBe("350.00");
  });

  test("RN-08: a recomendação usa a menor carga acumulada, mesmo que outro regime vença o primeiro ano", () => {
    const recommendation = new RegimeComparison(results).recommendation();
    expect(recommendation.regime).toBe("B");
    expect(recommendation.cumulativeSavings.toString()).toBe("50.00");
  });

  test("RN-08: empate no ano ou no acumulado fica com o primeiro regime informado", () => {
    const tied = [...flat("X", "IRPJ", { 2026: "10.00" }), ...flat("Y", "CBS", { 2026: "10.00" })];
    const comparison = new RegimeComparison(tied);
    expect(comparison.bestInYear(TaxYear.of(2026))).toBe("X");
    expect(comparison.recommendation().regime).toBe("X");
    expect(comparison.recommendation().cumulativeSavings.toString()).toBe("0.00");
    expect(comparison.recommendation().decisiveFactor.code).toBe("NONE");
  });

  test("RN-09: sem resultados não há o que comparar", () => {
    expect(() => new RegimeComparison([])).toThrow(InvalidInputError);
  });

  test("RN-08: ano ou regime desconhecido é rejeitado", () => {
    const comparison = new RegimeComparison(results);
    expect(() => comparison.bestInYear(TaxYear.of(2030))).toThrow(InvalidInputError);
    expect(() => comparison.cumulativeBurden("Z")).toThrow(InvalidInputError);
  });
});

describe("RN-08/RF-03: o fator que mais pesou na diferença", () => {
  test("RF-03: classifica por categoria; a diferença de CPP (folha) decide quando é a maior", () => {
    const results = [
      result("PRESUMIDO", 2026, [line("IRPJ", "100.00"), line("CPP", "500.00"), line("ISS", "50.00")]),
      result("SIMPLES", 2026, [
        line("DAS", "700.00", [line("IRPJ", "100.00"), line("CPP", "100.00"), line("ISS", "500.00")]),
      ]),
    ];
    const recommendation = new RegimeComparison(results).recommendation();
    // Presumido: 650. Simples: 700 => o presumido vence por 50.
    // Categorias (Simples - Presumido): renda 0, folha -400, consumo +450 => fator decisivo: consumo no Simples pesa contra.
    expect(recommendation.regime).toBe("PRESUMIDO");
    expect(recommendation.cumulativeSavings.toString()).toBe("50.00");
    expect(recommendation.decisiveFactor.code).toBe("CONSUMPTION_TAXES");
    expect(recommendation.decisiveFactor.difference.toString()).toBe("450.00");
    expect(recommendation.reason).toContain("tributos sobre o consumo");
  });

  test("RF-03: a folha decide quando o vencedor economiza mais nela", () => {
    const results = [
      result("A", 2026, [line("IRPJ", "100.00"), line("CPP", "100.00")]),
      result("B", 2026, [line("IRPJ", "100.00"), line("CPP", "300.00")]),
    ];
    const recommendation = new RegimeComparison(results).recommendation();
    expect(recommendation.regime).toBe("A");
    expect(recommendation.decisiveFactor.code).toBe("PAYROLL_CHARGES");
    expect(recommendation.decisiveFactor.difference.toString()).toBe("200.00");
  });

  test("RF-03: a renda (IRPJ e CSLL) decide quando a diferença está nela", () => {
    const results = [
      result("A", 2026, [line("IRPJ", "100.00"), line("CSLL", "50.00")]),
      result("B", 2026, [line("IRPJ", "400.00"), line("CSLL", "50.00")]),
    ];
    expect(new RegimeComparison(results).recommendation().decisiveFactor.code).toBe("INCOME_TAXES");
  });
});
