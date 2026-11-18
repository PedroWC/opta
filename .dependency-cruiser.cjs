/** Regra da dependência: camadas apontam para dentro (domain <- application <- infrastructure/presentation). */
module.exports = {
  forbidden: [
    { name: "domain-puro", severity: "error", comment: "domain não importa nenhuma outra camada nem frameworks.",
      from: { path: "^src/domain" }, to: { path: "^src/(application|infrastructure|presentation)|node_modules/(hono|@hono|zod|oracledb)" } },
    { name: "application-sem-adaptadores", severity: "error",
      from: { path: "^src/application" }, to: { path: "^src/(infrastructure|presentation)" } },
    { name: "presentation-sem-infraestrutura", severity: "error",
      from: { path: "^src/presentation" }, to: { path: "^src/infrastructure" } },
    { name: "sem-ciclos", severity: "error", from: {}, to: { circular: true } },
  ],
  options: { tsConfig: { fileName: "tsconfig.json" }, doNotFollow: { path: "node_modules" } },
};
