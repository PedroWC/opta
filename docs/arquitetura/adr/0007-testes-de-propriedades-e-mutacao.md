# ADR-0007 — Testes de propriedades e de mutação no núcleo

- **Status:** Aceito
- **Requisitos:** RNF-04, RN-03, RN-04, RN-08
- **Issue:** #13

## Contexto
A cobertura de linhas (mínimo de 80%) não diz se os testes pegam defeitos nas fórmulas fiscais. O núcleo (domínio e aplicação) usa aritmética exata e muitas regras de borda.

## Decisão
1. **Propriedades com fast-check** (`test/properties`) para as invariantes: ida e volta de dinheiro e alíquotas, arredondamento de no máximo meio centavo, alíquota efetiva entre 0 e a nominal e não decrescente até o sublimite de R$ 3,6 milhões, partilha do DAS somando o DAS, DAS total igual nos 8 anos, DAS híbrido não maior que o puro, crédito integral não menor que o embutido (RN-10), CBS/IBS nunca negativos, comparador devolvendo o menor acumulado, e a API nunca respondendo 500 a entradas arbitrárias.
2. **Mutação com Stryker** (`npm run mutation`) sobre `src/domain` e `src/application` (sem portas e tipos puros). Limiares em `stryker.config.json`: **alvo 90%**, aviso abaixo de 85% e **falha (`break`) abaixo de 85%**.
3. A mutação **não** roda no `npm run check` (é lenta); roda sob demanda e antes de mudar regras de cálculo. Relatório em `reports/mutation` (ignorado pelo git).

## Medição
Linha de base: 83,84% (207 testes). Depois de testar rótulos, mensagens, validações e fontes legais: **90,05%** (cobertura dos mutantes de 91,68%). Os mutantes que restam são sobretudo textos de mensagens e fontes.

## Consequências
A propriedade de monotonicidade revelou que a alíquota efetiva cai acima de R$ 3,6 milhões (ISS/ICMS saem do DAS); o limite é documentado em RN-04 e a API passou a avisar. O limiar de 85% pode subir conforme o núcleo cresce; mudá-lo exige novo ADR que substitua este.
