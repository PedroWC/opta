import type { OracleConnection, OracleConnectionProvider } from "./oracle-sql-executor.ts";
import type { OracleSettings } from "./oracle-settings.ts";

/** Pool do `oracledb` (modo Thin, sem Oracle Client). O módulo só é carregado quando o Oracle é escolhido. */
export class OracleConnectionPool implements OracleConnectionProvider {
  private constructor(private readonly pool: { getConnection(): Promise<OracleConnection> }) {}

  static async create(settings: OracleSettings): Promise<OracleConnectionPool> {
    const oracledb = (await import("oracledb")).default;
    const pool = await oracledb.createPool({
      user: settings.user,
      password: settings.password,
      connectString: settings.connectString,
      poolMin: 0,
      poolMax: 4,
    });
    return new OracleConnectionPool(pool as unknown as { getConnection(): Promise<OracleConnection> });
  }

  acquire(): Promise<OracleConnection> {
    return this.pool.getConnection();
  }
}
