import { createRequire } from "node:module";
import type { DatabaseSync } from "node:sqlite";
import type { SqlBinds, SqlExecutor, SqlRow } from "./sql-executor.ts";

// `node:sqlite` via require: o Vite (usado pelo Vitest) ainda não o reconhece como módulo nativo.
const { DatabaseSync: SqliteDatabase } = createRequire(import.meta.url)("node:sqlite") as typeof import("node:sqlite");

/** Adaptador SQLite (execução local e demonstração, ADR-0005), sobre o `node:sqlite`. */
export class SqliteSqlExecutor implements SqlExecutor {
  private readonly database: DatabaseSync;

  constructor(path: string = ":memory:") {
    this.database = new SqliteDatabase(path);
  }

  async query(sql: string, binds: SqlBinds = {}): Promise<SqlRow[]> {
    return this.database.prepare(sql).all({ ...binds }) as SqlRow[];
  }

  async execute(sql: string, binds: SqlBinds = {}): Promise<void> {
    this.database.prepare(sql).run({ ...binds });
  }

  close(): void {
    this.database.close();
  }
}
