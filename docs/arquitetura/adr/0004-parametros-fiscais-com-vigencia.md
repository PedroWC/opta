# ADR-0004 — Parâmetros fiscais em tabelas com vigência

- **Status:** Aceito
- **Requisitos:** RNF-05, RN-02

## Decisão
Alíquotas, faixas, repartições e parâmetros de regime ficam em tabelas com início e fim de vigência e fonte legal, acessadas por portas do domínio (`TaxRateTableRepository`). Atualizar a legislação é uma migração de dados, sem mudar código. Enquanto a persistência não existe, um repositório em memória fornece o cenário de referência.

## Consequências
Permite recalcular cenários antigos e comparar premissas. Exige seeds revisados contra a fonte legal.
