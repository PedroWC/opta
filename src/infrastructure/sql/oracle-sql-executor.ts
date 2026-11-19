import type { SqlBinds, SqlExecutor, SqlRow } from "./sql-executor.ts";

/** Parte da conexão do `oracledb` que o adaptador usa (permite testar sem banco). */
export interface OracleConnection {
  execute(
    sql: string,
    binds: Record<string, unknown>,
    options: { outFormat: number; autoCommit: boolean },
  ): Promise<{ rows?: unknown[] | undefined }>;
  close(): Promise<void>;
}

export interface OracleConnectionProvider {
  acquire(): Promise<OracleConnection>;
}

/**
 * Adaptador Oracle (banco principal, ADR-0005): bind variables por nome, uma conexão do pool por chamada,
 * sempre devolvida ao pool no `finally`.
 */
export class OracleSqlExecutor implements SqlExecutor {
  /** Valor de `oracledb.OUT_FORMAT_OBJECT`: linhas como objetos com colunas em maiúsculas. */
  static readonly OUT_FORMAT_OBJECT = 4002;

  constructor(private readonly connections: OracleConnectionProvider) {}

  async query(sql: string, binds: SqlBinds = {}): Promise<SqlRow[]> {
    return this.run(sql, binds, false);
  }

  async execute(sql: string, binds: SqlBinds = {}): Promise<void> {
    await this.run(sql, binds, true);
  }

  private async run(sql: string, binds: SqlBinds, autoCommit: boolean): Promise<SqlRow[]> {
    const connection = await this.connections.acquire();
    try {
      const result = await connection.execute(sql, { ...binds }, {
        outFormat: OracleSqlExecutor.OUT_FORMAT_OBJECT,
        autoCommit,
      });
      return (result.rows ?? []) as SqlRow[];
    } finally {
      await connection.close();
    }
  }
}
