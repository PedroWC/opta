import fc from "fast-check";
import { describe, expect, test } from "vitest";
import { CompositionRoot } from "../../src/composition-root.ts";
import { RegimeComparison } from "../../src/domain/comparison/regime-comparison.ts";
import { AnnualResult } from "../../src/domain/regimes/annual-result.ts";
import { LucroPresumido } from "../../src/domain/regimes/lucro-presumido.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { CbsStrategy } from "../../src/domain/taxes/cbs-strategy.ts";
import { IbsStrategy } from "../../src/domain/taxes/ibs-strategy.ts";
import { TaxLine } from "../../src/domain/taxes/tax-line.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

const repository = new InMemoryTaxRateTableRepository();

const contextFor = (cnae: string, revenue: bigint, payroll: bigint, purchases: number, year: number): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae,
      state: "SP",
      annualGrossRevenue: Money.fromCents(revenue),
      annualPayroll: Money.fromCents(payroll),
      b2bPercentage: 50,
      creditablePurchasesPercentage: purchases,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(year),
    repository,
  );

describe("RN-02: propriedades dos tributos sobre o consumo", () => {
  test("RN-02: CBS e IBS a pagar nunca são negativos nem passam do débito, e mais compras creditáveis nunca aumentam o imposto", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 0n, max: 5_000_000_000n }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 2026, max: 2033 }),
        async (revenue, purchasesA, purchasesB, year) => {
          const [low, high] = purchasesA <= purchasesB ? [purchasesA, purchasesB] : [purchasesB, purchasesA];
          for (const strategy of [new CbsStrategy(), new IbsStrategy()]) {
            const withLowCredit = await strategy.calculate(contextFor("6201-5/01", revenue, 0n, low, year));
            const withHighCredit = await strategy.calculate(contextFor("6201-5/01", revenue, 0n, high, year));
            const debit = withLowCredit.breakdown[0]?.amount ?? Money.zero();
            expect(withLowCredit.amount.isNegative()).toBe(false);
            expect(withLowCredit.amount.greaterThan(debit)).toBe(false);
            expect(withHighCredit.amount.greaterThan(withLowCredit.amount)).toBe(false);
          }
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe("RN-07: propriedades do Lucro Presumido", () => {
  test("RN-07: a carga nunca é negativa, a memória do IRPJ soma o IRPJ e o IRPJ nunca é menor que 15% da base presumida", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.bigInt({ min: 0n, max: 5_000_000_000n }),
        fc.bigInt({ min: 0n, max: 2_000_000_000n }),
        fc.constantFrom("6201-5/01", "4711-3/02"),
        fc.integer({ min: 2026, max: 2033 }),
        async (revenue, payroll, cnae, year) => {
          const result = await new LucroPresumido().simulate(contextFor(cnae, revenue, payroll, 30, year));
          expect(result.totalBurden().isNegative()).toBe(false);
          const irpj = result.lines.find((line) => line.code === "IRPJ");
          expect(irpj).toBeDefined();
          if (!irpj) return;
          const parts = irpj.breakdown.reduce((sum, part) => sum.add(part.amount), Money.zero());
          expect(parts.equals(irpj.amount)).toBe(true);
          expect(irpj.amount.greaterThan(TaxRate.fromPercentage("15").applyTo(irpj.base)) || irpj.amount.equals(TaxRate.fromPercentage("15").applyTo(irpj.base))).toBe(true);
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe("RN-08: propriedades do comparador", () => {
  const line = (amount: bigint): TaxLine =>
    new TaxLine("IRPJ", Money.zero(), TaxRate.zero(), Money.fromCents(amount), "teste");
  const results = fc
    .array(fc.array(fc.bigInt({ min: 0n, max: 1_000_000n }), { minLength: 1, maxLength: 4 }), { minLength: 1, maxLength: 4 })
    .map((regimes) =>
      regimes.flatMap((amounts, regimeIndex) =>
        amounts.map((amount, yearIndex) => new AnnualResult(`R${regimeIndex}`, TaxYear.of(2026 + yearIndex), [line(amount)])),
      ),
    );

  test("RN-08: a recomendação tem a menor carga acumulada, a economia não é negativa e o vencedor de cada ano tem a menor carga do ano", () => {
    fc.assert(
      fc.property(results, (all) => {
        const comparison = new RegimeComparison(all);
        const recommendation = comparison.recommendation();
        const winner = comparison.cumulativeBurden(recommendation.regime);
        for (const regime of comparison.regimes()) {
          expect(comparison.cumulativeBurden(regime).greaterThan(winner) || comparison.cumulativeBurden(regime).equals(winner)).toBe(true);
        }
        expect(recommendation.cumulativeSavings.isNegative()).toBe(false);
        for (const taxYear of TaxYear.horizon()) {
          const ofYear = all.filter((result) => result.taxYear.year === taxYear.year);
          if (ofYear.length === 0) continue;
          const best = comparison.bestInYear(taxYear);
          const bestBurden = ofYear.find((result) => result.regime === best)?.totalBurden() ?? Money.zero();
          for (const result of ofYear) expect(result.totalBurden().greaterThan(bestBurden) || result.totalBurden().equals(bestBurden)).toBe(true);
        }
      }),
    );
  });
});

describe("RNF-07 e RN-09: a API nunca responde 500 a uma entrada qualquer", () => {
  const handler = new CompositionRoot().httpServer.fetchHandler();
  const post = async (body: string, contentType = "application/json"): Promise<number> =>
    (
      await Promise.resolve(
        handler(new Request("http://localhost/v1/simulacoes", { method: "POST", headers: { "content-type": contentType }, body })),
      )
    ).status;

  test("RNF-07: qualquer JSON válido, mesmo estranho, responde 200, 400 ou 422", async () => {
    await fc.assert(
      fc.asyncProperty(fc.json(), async (json) => {
        expect([200, 400, 422]).toContain(await post(json));
      }),
      { numRuns: 150 },
    );
  });

  test("RNF-07: qualquer texto como corpo responde 400 ou 422, nunca 500", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 200 }), async (text) => {
        expect([200, 400, 422]).toContain(await post(text));
      }),
      { numRuns: 150 },
    );
  });

  test("RN-09: objetos com os campos certos e valores aleatórios nunca causam 500", async () => {
    const field = fc.oneof(fc.string({ maxLength: 20 }), fc.integer(), fc.constant(null), fc.boolean());
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          cnae: fc.oneof(fc.constantFrom("6201-5/01", "4711-3/02", "0000-0/00"), field),
          uf: fc.oneof(fc.constant("SP"), field),
          receita_bruta_anual: fc.oneof(fc.bigInt({ min: 0n, max: 90_000_000_000n }).map((v) => `${v / 100n}.${String(v % 100n).padStart(2, "0")}`), field),
          folha_anual: fc.oneof(fc.constant("1000.00"), field),
          perfil_clientes: fc.oneof(fc.record({ b2b_pct: fc.oneof(fc.integer({ min: -5, max: 105 }), field) }), field),
          compras_creditaveis_pct: fc.oneof(fc.integer({ min: -5, max: 105 }), field),
        }),
        async (body) => {
          expect([200, 422]).toContain(await post(JSON.stringify(body)));
        },
      ),
      { numRuns: 150 },
    );
  });
});
