# Persistência das tabelas fiscais

Complementa o [ADR-0004](adr/0004-parametros-fiscais-com-vigencia.md) (vigência) e o [ADR-0005](adr/0005-persistencia-oracle-com-sqlite-alternativo.md) (Oracle com SQLite alternativo). Requisito: RNF-05.

## Como escolher o repositório

A variável `OPTA_DB` define o adaptador da porta `TaxRateTableRepository` na raiz de composição:

| `OPTA_DB` | Adaptador | Configuração |
|---|---|---|
| `memory` (padrão) | `InMemoryTaxRateTableRepository` | nenhuma |
| `sqlite` | `SqlTaxRateTableRepository` + `SqliteSqlExecutor` | `OPTA_SQLITE_PATH` (padrão `opta.db`, ignorado pelo git) |
| `oracle` | `SqlTaxRateTableRepository` + `OracleSqlExecutor` | `OPTA_ORACLE_USER`, `OPTA_ORACLE_PASSWORD`, `OPTA_ORACLE_CONNECT_STRING` |

Credenciais só por variáveis de ambiente; nada é versionado. Nos modos `sqlite` e `oracle`, o serviço aplica as migrações e as sementes na subida.

## Estrutura

- Um único repositório SQL (`SqlTaxRateTableRepository`) fala com o banco por uma porta mínima, `SqlExecutor`, com **bind variables** sempre. Os dois adaptadores (`SqliteSqlExecutor`, `OracleSqlExecutor`) só executam o SQL; o SQL é o mesmo nos dois bancos.
- Valores decimais ficam em texto (`TEXT`/`VARCHAR2`) para manter a aritmética exata (RNF-02); datas de vigência em texto ISO (`AAAA-MM-DD`).
- A consulta de cada ano usa a data de referência `AAAA-01-01` e a condição `VIG_INI <= :ref AND (VIG_FIM IS NULL OR VIG_FIM >= :ref)`. Sem linha vigente, lança `EffectivePeriodNotFoundError` (`SIM-002`).
- Para mudar a legislação: encerrar a linha antiga (`VIG_FIM`) e inserir a nova com `VIG_INI` — sem mudar código.

## Tabelas

`ALIQUOTA_TRANSICAO`, `SIMPLES_ANEXO_FAIXA`, `SIMPLES_REPARTICAO`, `ATIVIDADE_CNAE` e `REGIME_PARAMETRO` (inclui a versão das premissas, `PREMISSAS/VERSAO`). Controle das migrações em `SCHEMA_MIGRACAO`.

## Migrações

Arquivos `V<n>__nome.sql` em `db/migrations/sqlite` ou `db/migrations/oracle` (DDL por dialeto) e `db/seeds` (sementes compartilhadas), aplicados em ordem numérica, uma só vez cada. Mudanças de esquema só acrescentam, para manter a compatibilidade com a versão anterior da aplicação. A semente `V2__premissas_2026_1.sql` reproduz o cenário de referência (⚠️ valores a conferir na fonte legal).

## Testes

A suíte `test/infrastructure/tax-rate-table-repository.contract.test.ts` roda o **mesmo contrato** contra o repositório em memória e o SQLite, incluindo a comparação dos três regimes. `sql-vigencia.test.ts` cobre a vigência, a migração e a resistência a injeção de SQL. O adaptador Oracle é testado com uma conexão falsa (bind por nome, conexão devolvida ao pool, `autoCommit`).

## Pendências

- Teste de integração contra um Oracle Free real (contêiner local ou Autonomous Database), que depende de credenciais do mantenedor: ainda não executado. O DDL Oracle (`db/migrations/oracle`) e o pool `oracledb` (modo Thin) não foram exercitados em um banco de verdade.
- O `node:sqlite` é carregado por `createRequire` porque o Vite usado pelo Vitest ainda não o reconhece como módulo nativo; em Node 22 ele exige a versão 22.13 ou superior e emite um aviso de recurso experimental.
