import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/domain/**", "src/application/**"],
      exclude: ["src/domain/ports/**", "src/domain/taxes/tax-strategy.ts", "src/domain/simples/das-component.ts", "src/domain/simples/simples-annex.ts"], // somente tipos/interfaces (sem código executável)
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
