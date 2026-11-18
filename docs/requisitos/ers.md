# Especificação de Requisitos de Software (ERS)

Visão e regras de cálculo: [especificação](../especificacao.md). Regras de negócio: [regras de negócio](regras-de-negocio.md). Rastreabilidade: [matriz](rastreabilidade.md).

## Requisitos funcionais

| ID | Requisito | Prioridade | Fase |
|---|---|---|---|
| RF-01 | Simular os regimes Simples Nacional, Simples híbrido e Lucro Presumido a partir de faturamento, folha, CNAE, UF e perfil de clientes (B2B/B2C). | Alta | MVP |
| RF-02 | Apresentar a carga tributária de cada regime ano a ano, de 2026 a 2033. | Alta | MVP |
| RF-03 | Recomendar o regime de menor carga e explicar o motivo da recomendação. | Alta | MVP |
| RF-04 | Consultar as premissas de alíquotas de transição (CBS, IBS, ICMS/ISS, PIS/Cofins) por ano. | Média | MVP |
| RF-05 | Consultar a atividade por CNAE (anexo do Simples, aplicabilidade do Fator R, presunção). | Média | MVP |
| RF-06 | Entregar a memória de cálculo auditável: cada linha traz base, alíquota, valor e fonte legal. | Alta | MVP |
| RF-07 | Expor a saúde e a versão do serviço. | Baixa | MVP |
| RF-08 | Interface web com formulário, tabela comparativa e gráfico por ano. | Alta | MVP |

## Requisitos não funcionais

| ID | Requisito |
|---|---|
| RNF-01 | O backend é 100% orientado a objetos: todo arquivo declara classes ou interfaces; a única exceção é o arquivo de bootstrap. Verificado por lint e por regras de dependência. |
| RNF-02 | Valores monetários e alíquotas usam aritmética exata (centavos em `bigint`), nunca `number`. |
| RNF-03 | O contrato da API (OpenAPI 3.1) é escrito antes da implementação e versionado em `/v1`. |
| RNF-04 | Cobertura mínima de 80% no núcleo (domínio e aplicação). |
| RNF-05 | Parâmetros fiscais ficam em tabelas com vigência, nunca no código. |
| RNF-06 | Nenhum segredo no repositório; dados informados na simulação não são registrados em log. |
| RNF-07 | Erros seguem o formato Problem Details (RFC 9457), com código estável (`SIM-nnn`). |
| RNF-08 | O domínio não depende de framework, banco ou HTTP (regra da dependência). |
