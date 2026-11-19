import { InvalidInputError } from "../../domain/errors/invalid-input-error.ts";
import type { TaxRateTableRepository } from "../../domain/ports/tax-rate-table-repository.ts";
import { InMemoryTaxRateTableRepository } from "../in-memory-tax-rate-table-repository.ts";
import { OracleConnectionPool } from "./oracle-connection-pool.ts";
import { OracleSettings } from "./oracle-settings.ts";
import { OracleSqlExecutor } from "./oracle-sql-executor.ts";
import { SqlMigrator } from "./sql-migrator.ts";
import { SqlTaxRateTableRepository } from "./sql-tax-rate-table-repository.ts";
import { SqliteSqlExecutor } from "./sqlite-sql-executor.ts";

/** Fábrica do repositório conforme o ambiente (ADR-0005): memória, SQLite ou Oracle. */
export class RepositoryProvider {
  async create(env: Readonly<Record<string, string | undefined>>): Promise<TaxRateTableRepository> {
    const choice = env["OPTA_DB"] ?? "memory";
    switch (choice) {
      case "memory":
        return new InMemoryTaxRateTableRepository();
      case "sqlite": {
        const executor = new SqliteSqlExecutor(env["OPTA_SQLITE_PATH"] ?? "opta.db");
        await new SqlMigrator(executor, "sqlite").migrate();
        return new SqlTaxRateTableRepository(executor);
      }
      case "oracle": {
        const pool = await OracleConnectionPool.create(OracleSettings.fromEnvironment(env));
        const executor = new OracleSqlExecutor(pool);
        await new SqlMigrator(executor, "oracle").migrate();
        return new SqlTaxRateTableRepository(executor);
      }
      default:
        throw new InvalidInputError(`OPTA_DB inválido: "${choice}". Use memory, sqlite ou oracle.`);
    }
  }
}
