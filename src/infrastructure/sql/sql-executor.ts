/** Linha de resultado; as colunas vêm sempre em maiúsculas (padrão do Oracle, e o SQL as escreve assim no SQLite). */
export type SqlRow = Readonly<Record<string, string | number | bigint | null>>;

export type SqlBinds = Readonly<Record<string, string | number | null>>;

/** Porta de execução de SQL com bind variables (nunca concatenar entrada em SQL), implementada por SQLite e Oracle. */
export interface SqlExecutor {
  query(sql: string, binds?: SqlBinds): Promise<SqlRow[]>;
  execute(sql: string, binds?: SqlBinds): Promise<void>;
}
