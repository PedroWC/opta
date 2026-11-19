import fc from "fast-check";
import { describe, expect, test } from "vitest";
import type { TaxRateTableRepository } from "../../src/domain/ports/tax-rate-table-repository.ts";
import { SimplesHibrido } from "../../src/domain/regimes/simples-hibrido.ts";
import { SimplesNacional } from "../../src/domain/regimes/simples-nacional.ts";
import { CompanyProfile } from "../../src/domain/shared/company-profile.ts";
import { Money } from "../../src/domain/shared/money.ts";
import { TaxRate } from "../../src/domain/shared/tax-rate.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { FatorR } from "../../src/domain/simples/fator-r.ts";
import type { SimplesAnnex } from "../../src/domain/simples/simples-annex.ts";
import { CalculationContext } from "../../src/domain/taxes/calculation-context.ts";
import { DasStrategy } from "../../src/domain/taxes/das-strategy.ts";
import { EmbeddedCustomerCredit } from "../../src/domain/taxes/embedded-customer-credit.ts";
import { FullCustomerCredit } from "../../src/domain/taxes/full-customer-credit.ts";
import { HybridDasStrategy } from "../../src/domain/taxes/hybrid-das-strategy.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";

const repository: TaxRateTableRepository = new InMemoryTaxRateTableRepository();
const SIMPLES_LIMIT_CENTS = 480_000_000n; // R$ 4,8 milhões
const SUBLIMIT_CENTS = 360_000_000n; // R$ 3,6 milhões
const annexes: readonly SimplesAnnex[] = ["III", "V"];

const revenueCents = (max: bigint) => fc.bigInt({ min: 1n, max });

const contextFor = (
  cnae: string,
  revenue: bigint,
  payroll: bigint,
  year: number,
  b2b = 50,
): CalculationContext =>
  new CalculationContext(
    new CompanyProfile({
      cnae,
      state: "SP",
      annualGrossRevenue: Money.fromCents(revenue),
      annualPayroll: Money.fromCents(payroll),
      b2bPercentage: b2b,
      creditablePurchasesPercentage: 30,
      icmsIssRate: TaxRate.fromPercentage("5"),
    }),
    TaxYear.of(year),
    repository,
  );

describe("RN-04: propriedades da alíquota efetiva e da partilha do DAS", () => {
  test("RN-04: a alíquota efetiva nunca é negativa nem passa da nominal da faixa", async () => {
    for (const annex of annexes) {
      const table = await repository.simplesAnnexTableFor(annex, TaxYear.of(2026));
      await fc.assert(
        fc.asyncProperty(revenueCents(SIMPLES_LIMIT_CENTS), async (cents) => {
          const rbt12 = Money.fromCents(cents);
          const bracket = table.bracketFor(rbt12);
          const effective = bracket.effectiveRate(rbt12);
          expect(effective.greaterThan(bracket.nominalRate)).toBe(false);
          expect(effective.greaterThan(TaxRate.zero()) || effective.equals(TaxRate.zero())).toBe(true);
        }),
      );
    }
  });

  test("RN-04: até o sublimite de R$ 3,6 milhões a alíquota efetiva não diminui quando a receita aumenta", async () => {
    // Acima de R$ 3,6 milhões a 6ª faixa tira o ISS/ICMS do DAS, e a alíquota efetiva cai por desenho da lei.
    for (const annex of annexes) {
      const table = await repository.simplesAnnexTableFor(annex, TaxYear.of(2026));
      await fc.assert(
        fc.asyncProperty(revenueCents(SUBLIMIT_CENTS), revenueCents(SUBLIMIT_CENTS), async (a, b) => {
          const [low, high] = a <= b ? [a, b] : [b, a];
          const lowRevenue = Money.fromCents(low);
          const highRevenue = Money.fromCents(high);
          const lowRate = table.bracketFor(lowRevenue).effectiveRate(lowRevenue);
          const highRate = table.bracketFor(highRevenue).effectiveRate(highRevenue);
          expect(lowRate.greaterThan(highRate)).toBe(false);
        }),
      );
    }
  });

  test("RN-04: a partilha de qualquer faixa soma exatamente o DAS e não tem parcela negativa", async () => {
    for (const annex of annexes) {
      const table = await repository.simplesAnnexTableFor(annex, TaxYear.of(2026));
      for (const bracket of table.brackets) {
        await fc.assert(
          fc.asyncProperty(fc.bigInt({ min: 0n, max: 1_000_000_000n }), async (cents) => {
            const parts = Object.values(bracket.partition.split(Money.fromCents(cents)));
            expect(parts.reduce((sum, part) => sum.add(part), Money.zero()).inCents()).toBe(cents);
            expect(parts.some((part) => part.isNegative())).toBe(false);
          }),
          { numRuns: 25 },
        );
      }
    }
  });

  test("RN-05: o Fator R é atingido exatamente quando folha x 100 >= receita x 28", () => {
    fc.assert(
      fc.property(fc.bigInt({ min: 0n, max: 1_000_000_000n }), fc.bigInt({ min: 1n, max: 1_000_000_000n }), (payroll, revenue) => {
        const reached = FatorR.of(Money.fromCents(payroll), Money.fromCents(revenue)).reachesThreshold();
        expect(reached).toBe(payroll * 100n >= revenue * 28n);
      }),
    );
  });
});

describe("RN-02 e RN-04: propriedades do DAS ao longo dos anos", () => {
  const dasInputs = fc.record({
    revenue: revenueCents(SIMPLES_LIMIT_CENTS),
    payrollShare: fc.integer({ min: 0, max: 100 }),
    cnae: fc.constantFrom("6201-5/01", "8630-5/04"),
  });

  test("RN-04: a partilha soma o DAS e o total é igual nos 8 anos (a transição só muda a composição)", async () => {
    await fc.assert(
      fc.asyncProperty(dasInputs, async ({ revenue, payrollShare, cnae }) => {
        const payroll = (revenue * BigInt(payrollShare)) / 100n;
        const totals = new Set<string>();
        for (const taxYear of TaxYear.horizon()) {
          const line = await new DasStrategy().calculate(contextFor(cnae, revenue, payroll, taxYear.year));
          const parts = line.breakdown.reduce((sum, part) => sum.add(part.amount), Money.zero());
          expect(parts.equals(line.amount)).toBe(true);
          expect(line.amount.isNegative()).toBe(false);
          totals.add(line.amount.toString());
        }
        expect(totals.size).toBe(1);
      }),
      { numRuns: 40 },
    );
  });

  test("RN-06: o DAS do híbrido nunca é maior que o do Simples puro, e o crédito integral nunca é menor que o embutido (RN-10)", async () => {
    await fc.assert(
      fc.asyncProperty(dasInputs, fc.integer({ min: 0, max: 100 }), fc.integer({ min: 2026, max: 2033 }), async ({ revenue, payrollShare, cnae }, b2b, year) => {
        const payroll = (revenue * BigInt(payrollShare)) / 100n;
        const context = contextFor(cnae, revenue, payroll, year, b2b);
        const pure = await new DasStrategy().calculate(context);
        const hybrid = await new HybridDasStrategy().calculate(context);
        expect(hybrid.amount.greaterThan(pure.amount)).toBe(false);
        const embedded = await new EmbeddedCustomerCredit().creditFor(context);
        const full = await new FullCustomerCredit().creditFor(context);
        expect(embedded.greaterThan(full)).toBe(false);
      }),
      { numRuns: 60 },
    );
  });

  test("RF-02: os regimes do Simples nunca têm carga negativa", async () => {
    await fc.assert(
      fc.asyncProperty(dasInputs, fc.integer({ min: 2026, max: 2033 }), async ({ revenue, payrollShare, cnae }, year) => {
        const payroll = (revenue * BigInt(payrollShare)) / 100n;
        const context = contextFor(cnae, revenue, payroll, year);
        expect((await new SimplesNacional().simulate(context)).totalBurden().isNegative()).toBe(false);
        expect((await new SimplesHibrido().simulate(context)).totalBurden().isNegative()).toBe(false);
      }),
      { numRuns: 40 },
    );
  });
});
