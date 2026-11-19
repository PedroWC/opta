import globals from "globals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Acessibilidade verificada em lint (RNF-09): jsx-a11y em modo estrito.
export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  ...tseslint.configs.strict,
  jsxA11y.flatConfigs.strict,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      // Painel de aba e região rolável precisam ser focáveis por teclado (APG; WCAG 2.1.1).
      "jsx-a11y/no-noninteractive-tabindex": ["error", { roles: ["tabpanel", "region"], tags: [] }],
    },
  },
  { files: ["*.config.{js,ts}"], languageOptions: { globals: globals.node } },
);
