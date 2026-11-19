# ADR-0005 — Persistência: Oracle com SQLite como alternativa

- **Status:** Aceito
- **Requisitos:** RNF-05, RNF-06

## Decisão
Oracle (Autonomous Database Free) é o banco principal; SQLite é a alternativa para execução local e demonstração. Ambos implementam a mesma porta de repositório. SQL sempre com bind variables; esquema versionado por migrações compatíveis com a versão anterior da aplicação. Credenciais só por variáveis de ambiente, nunca versionadas.

## Consequências
Dois adaptadores para manter, cobertos pelos mesmos testes de contrato do repositório.
