import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules", "dist", "coverage"] },
  ...tseslint.configs.strict,
  {
    files: ["src/**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    // Diretriz 4.1 da especificação: backend 100% orientado a objetos.
    // Funções e constantes soltas exportadas são proibidas fora do bootstrap.
    files: ["src/**/*.ts"],
    ignores: ["src/main.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "ExportNamedDeclaration > FunctionDeclaration", message: "Backend é 100% OO: exporte uma classe, não uma função." },
        { selector: "ExportDefaultDeclaration > FunctionDeclaration", message: "Backend é 100% OO: exporte uma classe, não uma função." },
        { selector: "ExportNamedDeclaration > VariableDeclaration", message: "Backend é 100% OO: exporte uma classe, não variáveis soltas." },
      ],
    },
  },
);
