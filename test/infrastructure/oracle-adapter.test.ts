import { describe, expect, test } from "vitest";
import { InvalidInputError } from "../../src/domain/errors/invalid-input-error.ts";
import { InMemoryTaxRateTableRepository } from "../../src/infrastructure/in-memory-tax-rate-table-repository.ts";
import { OracleSettings } from "../../src/infrastructure/sql/oracle-settings.ts";
import {
  OracleSqlExecutor,
  type OracleConnection,
  type OracleConnectionProvider,
} from "../../src/infrastructure/sql/oracle-sql-executor.ts";
import { RepositoryProvider } from "../../src/infrastructure/sql/repository-provider.ts";

type Options = { outFormat: number; autoCommit: boolean };

class RecordingConnection implements OracleConnection {
  readonly calls: { sql: string; binds: Record<string, unknown>; options: Options }[] = [];
  closed = 0;

  constructor(private readonly outcome: { rows?: unknown[] } | Error) {}

  async execute(sql: string, binds: Record<string, unknown>, options: Options): Promise<{ rows?: unknown[] }> {
    this.calls.push({ sql, binds, options });
    if (this.outcome instanceof Error) throw this.outcome;
    return this.outcome;
  }

  async close(): Promise<void> {
    this.closed += 1;
  }
}

const provider = (connection: OracleConnection): OracleConnectionProvider => ({ acquire: async () => connection });

describe("RNF-05: adaptador Oracle (bind variables e conexão devolvida ao pool)", () => {
  test("RNF-05: query envia o SQL com binds por nome, pede linhas como objeto e devolve as linhas", async () => {
    const connection = new RecordingConnection({ rows: [{ ANO: 2026 }] });
    const rows = await new OracleSqlExecutor(provider(connection)).query("SELECT ANO FROM T WHERE ANO = :ano", { ano: 2026 });
    expect(rows).toEqual([{ ANO: 2026 }]);
    expect(connection.calls).toEqual([
      {
        sql: "SELECT ANO FROM T WHERE ANO = :ano",
        binds: { ano: 2026 },
        options: { outFormat: OracleSqlExecutor.OUT_FORMAT_OBJECT, autoCommit: false },
      },
    ]);
    expect(connection.closed).toBe(1);
  });

  test("RNF-05: execute confirma a transação (autoCommit) e devolve a conexão ao pool", async () => {
    const connection = new RecordingConnection({});
    await new OracleSqlExecutor(provider(connection)).execute("INSERT INTO T (X) VALUES (:x)", { x: "a" });
    expect(connection.calls[0]?.options.autoCommit).toBe(true);
    expect(connection.closed).toBe(1);
  });

  test("RNF-05: a conexão é devolvida ao pool mesmo quando o SQL falha, e o erro se propaga", async () => {
    const connection = new RecordingConnection(new Error("ORA-00942"));
    await expect(new OracleSqlExecutor(provider(connection)).query("SELECT 1 FROM X")).rejects.toThrow("ORA-00942");
    expect(connection.closed).toBe(1);
  });

  test("RNF-05: sem linhas no resultado devolve lista vazia", async () => {
    const connection = new RecordingConnection({});
    expect(await new OracleSqlExecutor(provider(connection)).query("SELECT 1 FROM DUAL")).toEqual([]);
  });
});

describe("ADR-0005: configuração por ambiente, sem segredos no repositório", () => {
  test("ADR-0005: as credenciais do Oracle vêm só de variáveis de ambiente", () => {
    const settings = OracleSettings.fromEnvironment({
      OPTA_ORACLE_USER: "usuario",
      OPTA_ORACLE_PASSWORD: "valor-de-teste",
      OPTA_ORACLE_CONNECT_STRING: "localhost/FREEPDB1",
    });
    expect([settings.user, settings.connectString]).toEqual(["usuario", "localhost/FREEPDB1"]);
  });

  test("ADR-0005: faltando variável do Oracle, o erro é tipado", () => {
    expect(() => OracleSettings.fromEnvironment({ OPTA_ORACLE_USER: "usuario" })).toThrow(InvalidInputError);
  });

  test("ADR-0005: OPTA_DB padrão é memória e valor desconhecido é rejeitado", async () => {
    expect(await new RepositoryProvider().create({})).toBeInstanceOf(InMemoryTaxRateTableRepository);
    await expect(new RepositoryProvider().create({ OPTA_DB: "mongo" })).rejects.toBeInstanceOf(InvalidInputError);
  });

  test("ADR-0005: OPTA_DB=sqlite migra e serve as mesmas tabelas", async () => {
    const repository = await new RepositoryProvider().create({ OPTA_DB: "sqlite", OPTA_SQLITE_PATH: ":memory:" });
    expect(await repository.assumptionsVersion()).toBe("2026.1");
  });
});
