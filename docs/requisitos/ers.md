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
| RF-09 | A simulação pode ser reaberta e compartilhada por link, sem armazenar dados no servidor (estado no fragmento da URL). | Média | MVP |
| RF-10 | O formulário oferece um exemplo preenchido (cenário da US-01) e uma dica do Fator R aproximado, informativa. | Baixa | MVP |
| RF-11 | A interface exibe, em todas as telas, o aviso de simulador educacional e a versão das premissas, e traz uma página de metodologia com as fontes legais. | Alta | MVP |

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
| RNF-09 | Acessibilidade WCAG 2.2 nível AA nas telas do simulador, verificada por axe no CI e por teste manual com teclado e leitor de tela. |
| RNF-10 | Interface responsiva de 320 px a 1440 px, sem rolagem horizontal da página em 320 px. |
| RNF-11 | Desempenho percebido: LCP ≤ 2,5 s em 4G simulado, JS inicial ≤ 200 KB gzip e CLS < 0,1. |
| RNF-12 | O front-end não registra nem envia a terceiros os dados da simulação (sem analytics no MVP); os dados do link ficam no fragmento da URL. |
