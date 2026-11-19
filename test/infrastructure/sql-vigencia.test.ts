import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { EffectivePeriodNotFoundError } from "../../src/domain/errors/effective-period-not-found-error.ts";
import { TaxYear } from "../../src/domain/shared/tax-year.ts";
import { SqlMigrator } from "../../src/infrastructure/sql/sql-migrator.ts";
import { SqlTaxRateTableRepository } from "../../src/infrastructure/sql/sql-tax-rate-table-repository.ts";
import { SqliteSqlExecutor } from "../../src/infrastructure/sql/sqlite-sql-executor.ts";

const executors: SqliteSqlExecutor[] = [];
const freshDatabase = async (): Promise<{ executor: SqliteSqlExecutor; repository: SqlTaxRateTableRepository }> => {
  const executor = new SqliteSqlExecutor();
  executors.push(executor);
  await new SqlMigrator(executor, "sqlite").migrate();
  return { executor, repository: new SqlTaxRateTableRepository(executor) };
};
afterEach(() => {
  while (executors.length > 0) executors.pop()?.close();
});

describe("ADR-0004 e RNF-05: parâmetros por vigência", () => {
  test("RNF-05: uma nova faixa com vigência a partir de 2028 vale só de 2028 em diante, sem mudar código", async () => {
    const { executor, repository } = await freshDatabase();
    await executor.execute("UPDATE SIMPLES_ANEXO_FAIXA SET VIG_FIM = :fim WHERE ANEXO = :anexo AND FAIXA = :faixa", {
      fim: "2027-12-31",
      anexo: "III",
      faixa: 1,
    });
    await executor.execute(
      `INSERT INTO SIMPLES_ANEXO_FAIXA (ANEXO, FAIXA, RBT12_ATE, ALIQ_NOMINAL, PARC_DEDUZIR, VIG_INI, VIG_FIM)
       VALUES (:anexo, :faixa, :ate, :aliq, :parc, :ini, NULL)`,
      { anexo: "III", faixa: 1, ate: "180000.00", aliq: "7.0000", parc: "0.00", ini: "2028-01-01" },
    );
    const before = await repository.simplesAnnexTableFor("III", TaxYear.of(2027));
    const after = await repository.simplesAnnexTableFor("III", TaxYear.of(2028));
    expect(before.brackets[0]?.nominalRate.toString()).toBe("6.0000%");
    expect(after.brackets[0]?.nominalRate.toString()).toBe("7.0000%");
  });

  test("RNF-05: ano sem parâmetro vigente lança EffectivePeriodNotFoundError (SIM-002)", async () => {
    const { executor, repository } = await freshDatabase();
    await executor.execute("DELETE FROM ALIQUOTA_TRANSICAO WHERE ANO = :ano", { ano: 2031 });
    await expect(repository.transitionRatesFor(TaxYear.of(2031))).rejects.toBeInstanceOf(EffectivePeriodNotFoundError);
  });

  test("RNF-05: sem as tabelas de Simples vigentes, o erro de vigência é explícito", async () => {
    const { executor, repository } = await freshDatabase();
    await executor.execute("DELETE FROM SIMPLES_ANEXO_FAIXA WHERE ANEXO = :anexo", { anexo: "V" });
    await expect(repository.simplesAnnexTableFor("V", TaxYear.of(2026))).rejects.toBeInstanceOf(EffectivePeriodNotFoundError);
  });

  test("RNF-05: parâmetro do Lucro Presumido ausente também é erro de vigência", async () => {
    const { executor, repository } = await freshDatabase();
    await executor.execute("DELETE FROM REGIME_PARAMETRO WHERE CHAVE = :chave", { chave: "CPP_ALIQ" });
    await expect(repository.lucroPresumidoParametersFor(TaxYear.of(2026))).rejects.toBeInstanceOf(EffectivePeriodNotFoundError);
  });

  test("RNF-05: SQL com bind variables: entradas com aspas e comandos SQL não são interpretadas", async () => {
    const { repository } = await freshDatabase();
    expect(await repository.findActivity("' OR '1'='1")).toBeNull();
    const hostile = "'; DELETE FROM ATIVIDADE_CNAE; --";
    expect((await repository.searchActivities(hostile, 1, 10)).items).toEqual([]);
    expect(await repository.findActivity("6201-5/01")).not.toBeNull();
  });
});

describe("RNF-05: migrações versionadas", () => {
  test("RNF-05: aplica o esquema e as sementes uma só vez (idempotente)", async () => {
    const executor = new SqliteSqlExecutor();
    executors.push(executor);
    const migrator = new SqlMigrator(executor, "sqlite");
    expect(await migrator.migrate()).toEqual(["V1__esquema.sql", "V2__premissas_2026_1.sql"]);
    expect(await migrator.migrate()).toEqual([]);
    const [count] = await executor.query("SELECT COUNT(*) AS N FROM ALIQUOTA_TRANSICAO");
    expect(Number(count?.["N"])).toBe(8);
  });

  test("RNF-05: aplica em ordem numérica de versão (V2 antes de V10), ignorando comentários", async () => {
    const root = mkdtempSync(join(tmpdir(), "opta-migracoes-"));
    try {
      mkdirSync(join(root, "migrations", "sqlite"), { recursive: true });
      mkdirSync(join(root, "seeds"), { recursive: true });
      writeFileSync(join(root, "migrations", "sqlite", "V2__a.sql"), "-- criar\nCREATE TABLE A (X INTEGER);\n");
      writeFileSync(join(root, "seeds", "V10__b.sql"), "INSERT INTO A (X) VALUES (1);\nINSERT INTO A (X) VALUES (2);\n");
      const executor = new SqliteSqlExecutor();
      executors.push(executor);
      expect(await new SqlMigrator(executor, "sqlite", root).migrate()).toEqual(["V2__a.sql", "V10__b.sql"]);
      const [count] = await executor.query("SELECT COUNT(*) AS N FROM A");
      expect(Number(count?.["N"])).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
