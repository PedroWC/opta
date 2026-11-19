import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SqlExecutor } from "./sql-executor.ts";

export type SqlDialect = "sqlite" | "oracle";

/**
 * Aplica as migrações versionadas (`db/migrations/<dialeto>`) e as sementes (`db/seeds`) em ordem, uma
 * só vez cada, registrando em SCHEMA_MIGRACAO. Compatível com a versão anterior da aplicação: só adiciona.
 */
export class SqlMigrator {
  private static readonly TABLE = "SCHEMA_MIGRACAO";

  constructor(
    private readonly executor: SqlExecutor,
    private readonly dialect: SqlDialect,
    private readonly root: string = "db",
  ) {}

  async migrate(): Promise<string[]> {
    await this.ensureControlTable();
    const applied = new Set((await this.executor.query(`SELECT ARQUIVO AS ARQUIVO FROM ${SqlMigrator.TABLE}`)).map((row) => String(row["ARQUIVO"])));
    const done: string[] = [];
    for (const file of this.files()) {
      if (applied.has(file.name)) continue;
      for (const statement of this.statementsOf(file.path)) await this.executor.execute(statement);
      await this.executor.execute(`INSERT INTO ${SqlMigrator.TABLE} (ARQUIVO) VALUES (:arquivo)`, { arquivo: file.name });
      done.push(file.name);
    }
    return done;
  }

  private async ensureControlTable(): Promise<void> {
    const exists =
      this.dialect === "sqlite"
        ? "SELECT COUNT(*) AS N FROM sqlite_master WHERE type = 'table' AND name = :nome"
        : "SELECT COUNT(*) AS N FROM USER_TABLES WHERE TABLE_NAME = :nome";
    const [row] = await this.executor.query(exists, { nome: SqlMigrator.TABLE });
    if (Number(row?.["N"] ?? 0) > 0) return;
    const ddl =
      this.dialect === "sqlite"
        ? `CREATE TABLE ${SqlMigrator.TABLE} (ARQUIVO TEXT NOT NULL PRIMARY KEY)`
        : `CREATE TABLE ${SqlMigrator.TABLE} (ARQUIVO VARCHAR2(200) NOT NULL PRIMARY KEY)`;
    await this.executor.execute(ddl);
  }

  private files(): { name: string; path: string }[] {
    const collect = (directory: string): { name: string; path: string }[] =>
      readdirSync(directory)
        .filter((name) => /^V\d+__.+\.sql$/.test(name))
        .map((name) => ({ name, path: join(directory, name) }));
    const all = [...collect(join(this.root, "migrations", this.dialect)), ...collect(join(this.root, "seeds"))];
    return all.sort((a, b) => this.version(a.name) - this.version(b.name));
  }

  private version(name: string): number {
    return Number(/^V(\d+)__/.exec(name)?.[1] ?? 0);
  }

  private statementsOf(path: string): string[] {
    const text = readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    return text
      .split(/;\s*(?:\n|$)/)
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);
  }
}
