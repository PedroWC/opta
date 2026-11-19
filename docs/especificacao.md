# Opta — Simulador de regimes tributários na Reforma (especificação v0.2)

> Projeto vitrine de portfólio. Status: rascunho para revisão. Esta é a fonte de visão e regras de cálculo; os requisitos rastreáveis (RF, RNF, RN) estão em `docs/requisitos/`.
> **Aviso:** simulador educacional, não é consultoria tributária. Números de artigos e alíquotas marcados com ⚠️ devem ser conferidos na fonte antes de codificar (legislação em transição e ainda regulamentada).

## 1. Visão

**Problema.** Micro e pequenas empresas não sabem se, com a Reforma Tributária do Consumo (EC 132/2023, LC 214/2025), compensa ficar no Simples Nacional "puro", optar pelo Simples com IBS/CBS recolhidos por fora (o "Simples híbrido") ou migrar para o Lucro Presumido.

**Proposta.** Aplicação web em que o usuário informa faturamento, folha, CNAE e perfil de clientes (B2B/B2C) e recebe a carga tributária comparada dos três regimes, **ano a ano de 2026 a 2033**, com recomendação e explicação.

**Diferencial.** Mostrar *quando* vale optar por recolher IBS/CBS por fora do DAS: no Simples puro o cliente PJ só aproveita crédito reduzido (proporcional à alíquota efetiva embutida no DAS); no híbrido ele aproveita o crédito cheio. Logo, quanto maior a fatia B2B e a margem de insumos creditáveis, maior a vantagem competitiva e fiscal do híbrido.

**Para o portfólio:** demonstra domínio de domínio fiscal complexo, OOP, Strategy, dados versionados por vigência, API bem desenhada, testes pesados e documentação (ADRs).

## 2. Escopo do MVP

Dentro:
- Atividades de **serviços e comércio**, sem substituição tributária, sem monofasia, sem Imposto Seletivo.
- Três regimes: Simples Nacional, Simples híbrido, Lucro Presumido.
- Horizonte 2026–2033, um cenário-base de alíquotas de referência (parametrizável).
- Entradas: receita bruta anual (e RBT12 mensal opcional), folha (para Fator R e CPP), CNAE, % B2B, compras creditáveis (% do faturamento), UF/município (alíquota de ISS/ICMS informada pelo usuário no MVP).
- Saída: tabela por ano e regime, gráfico, recomendação, memória de cálculo auditável.

Fora (roadmap): indústria, ST, MEI, Lucro Real, regimes específicos (combustíveis, saúde, financeiro), produtos com redução (cesta básica etc.), cashback, Imposto Seletivo, múltiplas atividades com anexos mistos, sublimite estadual.

## 3. Regras de cálculo e fontes

Cada regra vira uma entrada de catálogo (`RN-xx`) com fonte, vigência e testes.

### 3.1 Transição CBS/IBS (⚠️ conferir LC 214/2025, arts. de transição, e EC 132)
| Ano | CBS | IBS | PIS/Cofins | ICMS/ISS |
|---|---|---|---|---|
| 2026 | 0,9% (teste, compensável) | 0,1% (teste) | vigentes | vigentes |
| 2027 | alíquota plena | 0,1% | extintos | vigentes |
| 2028 | plena | 0,1% | — | vigentes |
| 2029 | plena | 10% da alíq. | — | 90% |
| 2030 | plena | 20% | — | 80% |
| 2031 | plena | 30% | — | 70% |
| 2032 | plena | 40% | — | 60% |
| 2033 | plena | 100% | — | extintos |

Alíquotas de referência: CBS ≈ 8,8% e IBS ≈ 17,7% (soma ≈ 26,5%) como **premissa configurável**; a fixação final é por resolução do Senado/lei. As alíquotas ficam em tabela versionada, nunca em código.

### 3.2 Simples Nacional (LC 123/2006 com alterações da LC 214/2025 e LC 227/2026 ⚠️)
- Alíquota efetiva = `(RBT12 × alíq_nominal − parcela_a_deduzir) / RBT12`, por anexo (III, IV, V; I e II no pós-MVP) e faixa.
- **Fator R** = folha12 / RBT12; ≥ 28% leva atividades do Anexo V ao Anexo III. Modelagem de estado inspirada no `ModoFatorR` do repositório de referência (`NAO_APLICAVEL`, `OPCIONAL`, `INDISPONIVEL`, `OBRIGATORIO`).
- Partilha do DAS: o DAS é repartido entre IRPJ, CSLL, Cofins, PIS, CPP, ICMS/ISS conforme tabela de repartição. Durante a transição, as parcelas de PIS/Cofins e, depois, ICMS/ISS são substituídas por CBS/IBS dentro do DAS (a alíquota total do DAS é mantida; muda a composição). ⚠️ Conferir tabelas de repartição atualizadas.
- Crédito ao adquirente PJ: no regime puro, limitado ao valor de CBS/IBS efetivamente embutido no DAS (proporção da alíquota efetiva); no híbrido, crédito cheio.

### 3.3 Simples híbrido (opção pelo regime regular de IBS/CBS) ⚠️ LC 214/2025, dispositivos que permitem ao optante recolher IBS/CBS fora do DAS
- Optante continua pagando IRPJ, CSLL, CPP, e a parcela restante do DAS **sem** PIS/Cofins/ICMS/ISS (retirados da base do DAS na proporção da repartição).
- IBS/CBS apurados pelo regime normal: `débito (receita × alíquota) − crédito (compras creditáveis × alíquota)`.
- A decisão é anual e irretratável no ano (conferir regra de janela de opção).
- Ganho: crédito cheio ao cliente B2B e crédito próprio de compras. Custo: obrigações acessórias maiores e carga potencialmente maior quando margem é alta e vendas são B2C.

### 3.4 Lucro Presumido
- Presunção: comércio 8% / serviços em geral 32% (outras faixas por atividade) para IRPJ; CSLL 12% / 32%. ⚠️ A LC 224/2025 majorou as presunções para a parcela de receita acima de R$ 5 mi/ano a partir de 2026: conferir.
- IRPJ 15% + adicional 10% sobre o excedente de R$ 20 mil/mês de base; CSLL 9%.
- Até 2026: PIS 0,65% + Cofins 3% (cumulativos); ISS 2–5% (serviços) ou ICMS (comércio, MVP: alíquota informada, sem ST).
- A partir de 2027: CBS e IBS em regime normal (débito − crédito), ISS/ICMS decrescem conforme 3.1.
- CPP patronal 20% + RAT + terceiros sobre a folha (Anexo IV do Simples também cobra CPP por fora; nos demais está no DAS).

### 3.5 Recomendação
Menor carga total anual do ano em análise **e** menor carga acumulada 2026–2033 (com valor presente opcional). A resposta traz sempre o *porquê* (maior contribuinte da diferença: crédito de B2B, margem, folha, faixa do Simples).

### 3.6 Fontes
EC 132/2023; LC 214/2025 (IBS, CBS, IS); LC 227/2026 (Comitê Gestor e ajustes) ⚠️; LC 123/2006 (Simples); LC 224/2025 ⚠️; Lei 9.249/1995 (presunção, IRPJ/CSLL); Lei 9.430/1996; resoluções do Comitê Gerenciador do Simples; NT 2026.005 e as calculadoras RTC da Receita/SERPRO (usadas apenas como referência de regras: matriz de regime do Simples, Fator R e transição de alíquotas).

## 4. Modelo de domínio (OOP)

> Os nomes abaixo estão em português para leitura da regra; no código os identificadores seguem em inglês (ver glossário em `docs/arquitetura/glossario.md`).

```
«abstract» RegimeTributario
  + simular(entrada: EntradaEmpresa, ano: number): ResultadoAnual
  # tributos(): TributoStrategy[]           // template method
  ├─ SimplesNacional
  ├─ SimplesHibrido  (extends SimplesNacional; troca estratégias de PIS/Cofins/ICMS/ISS por CBS/IBS regulares)
  └─ LucroPresumido

«interface» TributoStrategy { calcular(ctx: ContextoCalculo): LinhaTributo }
  DasStrategy, CbsStrategy, IbsStrategy, PisCofinsStrategy,
  IcmsStrategy, IssStrategy, IrpjStrategy, CsllStrategy, CppStrategy

Value Objects: Dinheiro (decimal.js/BigInt centavos), Aliquota, Competencia, Cnae, Percentual
Entidades: EntradaEmpresa, ResultadoAnual, LinhaTributo (com memória de cálculo + fonte legal)
Serviços: SimuladorService (compara regimes), RecomendadorService, TabelaAliquotasRepository (porta)
Padrões: Strategy (tributos), Template Method (RegimeTributario), Factory (RegimeFactory), 
         Repository (tabelas por vigência), Specification (elegibilidade/limites do Simples)
```
Regras: domínio sem dependência de framework/banco; dinheiro nunca em `number` (precisão numérica: ver ADR003 dos repositórios de referência); arredondamento centralizado e documentado.

### 4.1 Diretriz: backend 100% orientado a objetos (obrigatória)
Todo arquivo do backend declara **classes** (ou interfaces/tipos abstratos que classes implementam). Não há módulos de funções soltas, scripts procedurais nem "utils" com funções estáticas de negócio.

- **Tudo é objeto:** regras fiscais em classes (`RegimeTributario` e subclasses, `TributoStrategy`), valores em Value Objects imutáveis (`Dinheiro`, `Aliquota`, `Competencia`, `Cnae`), serviços de aplicação como classes (`SimularRegimesUseCase`), repositórios como classes que implementam portas (`TabelaAliquotasRepository` → `OracleTabelaAliquotasRepository`, `SqliteTabelaAliquotasRepository`).
- **API HTTP também em classes:** controllers (`SimulacaoController`), mapeadores (`SimulacaoMapper`), tratador de erros (`ProblemDetailsHandler`) e a raiz de composição (`CompositionRoot`/`Container`) são classes; o Hono é só um adaptador fino chamado por elas.
- **Erros:** hierarquia de exceções tipadas (`DomainError` → `EntradaInvalidaError`, `VigenciaNaoEncontradaError`...).
- **Herança só onde há "é um" real** (`SimplesHibrido extends SimplesNacional`, regimes via Template Method, no máximo 2–3 níveis); no resto, composição e injeção por construtor.
- **Encapsulamento:** estado privado/`readonly`, comportamento no objeto ("diga, não pergunte"), sem getters/setters triviais em massa; sem `any`.
- **Dependências para dentro:** domínio não importa Hono, Zod nem `oracledb`; adaptadores implementam portas do domínio (SOLID/D).
- **Estrutura de pastas por camada:** `domain/` (entidades, VOs, regimes, estratégias, portas) · `application/` (casos de uso) · `infrastructure/` (repositórios Oracle/SQLite, config) · `presentation/` (controllers, DTOs, schemas Zod encapsulados em classes validadoras).
- **Exceção explícita:** apenas o arquivo de bootstrap (`main.ts`) pode ser procedural, limitado a instanciar `CompositionRoot` e iniciar o servidor. O front-end React fica fora desta regra.
- **Verificação automática:** regra de lint (ex.: `eslint` com `no-restricted-syntax` para `export function` fora de `main.ts`) e `dependency-cruiser` para impedir `domain/` de importar `infrastructure/`.

## 5. Contrato da API (REST, OpenAPI 3.1, erros RFC 9457)

`POST /v1/simulacoes`
```json
{
  "ano_base": 2026,
  "cnae": "6201-5/01",
  "uf": "SP",
  "aliquota_iss": 0.05,
  "receita_bruta_anual": 1800000.00,
  "folha_anual": 540000.00,
  "perfil_clientes": { "b2b": 0.7, "b2c": 0.3 },
  "compras_creditaveis_pct": 0.25,
  "regimes": ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"]
}
```
Resposta `200`: `{ id, premissas_versao, anos: [{ ano, regimes: [{ regime, carga_total, aliquota_efetiva, tributos: [{codigo, base, aliquota, valor, fonte}] }], melhor_regime }], recomendacao: { regime, motivo, economia_acumulada }, avisos: [] }`

Outros: `GET /v1/atividades?cnae=` (anexo, Fator R aplicável), `GET /v1/premissas/aliquotas?ano=`, `GET /v1/versao`. Erros `422` para entrada inválida (Zod), `problem+json` com código estável (`SIM-001`...). Versionamento por prefixo `/v1`; contrato escrito antes da implementação.

## 6. Modelo de dados

Banco: **Oracle Autonomous DB Free** (alinhado ao seu perfil) com SQLite como alternativa local/demo via repositório intercambiável. Migrations versionadas (Flyway ou node-oracledb + scripts). SQL sempre com bind variables.

| Tabela | Colunas principais |
|---|---|
| `ALIQUOTA_TRANSICAO` | `ANO`, `CBS_PCT`, `IBS_PCT_SOBRE_REF`, `ICMS_ISS_PCT`, `PIS_COFINS_EXTINTO`, `FONTE`, `VIG_INI`, `VIG_FIM` |
| `ALIQUOTA_REFERENCIA` | `TRIBUTO` (CBS/IBS), `PCT`, `VIG_INI`, `VIG_FIM`, `CENARIO` |
| `SIMPLES_ANEXO_FAIXA` | `ANEXO`, `FAIXA`, `RBT12_DE`, `RBT12_ATE`, `ALIQ_NOMINAL`, `PARC_DEDUZIR`, `VIG_INI` |
| `SIMPLES_REPARTICAO` | `ANEXO`, `FAIXA`, `TRIBUTO`, `PCT`, `VIG_INI` |
| `ATIVIDADE_CNAE` | `CNAE`, `DESCRICAO`, `ANEXO_SEM_FATOR_R`, `ANEXO_COM_FATOR_R`, `PRESUNCAO_IRPJ`, `PRESUNCAO_CSLL` |
| `REGIME_PARAMETRO` | `REGIME`, `CHAVE`, `VALOR`, `VIG_INI`, `FONTE` |
| `SIMULACAO` / `SIMULACAO_RESULTADO` | entrada (JSON), versão de premissas, resultado por ano/regime (opcional, para link compartilhável) |

Padrão de vigência (`VIG_INI`/`VIG_FIM`) em tudo que muda por lei, para recalcular cenários históricos e atualizar regras por script, sem mexer em código (mesma ideia das calculadoras RTC).

## 7. Arquitetura e stack

- Backend 100% OO (ver 4.1).
- Monólito modular: `domain` (regras puras) → `application` (casos de uso) → `infra` (Oracle, HTTP). Núcleo como API; o front consome.
- **Backend:** TypeScript, Bun + Hono, Zod, `decimal.js`, `oracledb` (ou driver via repositório), Vitest/`bun test`, fast-check para propriedades (ex.: carga nunca negativa, monotonicidade).
- **Frontend:** React + Vite, TanStack Query, Recharts/visx, formulário com Zod compartilhado.
- **Infra:** Docker Compose (Oracle Free local), GitHub Actions (lint, testes, build), deploy em Fly.io/Render + OCI Always Free para o Oracle.
- **Decisões a registrar em ADR:** precisão numérica, vigência por tabela, Strategy vs. regras em DSL, Hono vs. NestJS, Oracle vs. SQLite.
- Se preferir mais "enterprise Java-like" para mostrar OOP/decorators, NestJS é alternativa; Hono é mais leve e rápido de demonstrar.

## 8. Testes e qualidade

- Unitários por tributo e por regime com casos "golden" calculados em planilha (conferência independente).
- Propriedades (fast-check) nas fórmulas do Simples e da transição.
- Contrato OpenAPI testado; E2E Playwright de 1–2 fluxos.
- Cobertura mínima nas regras de cálculo; mutation testing (Stryker) no núcleo como diferencial.

## 9. Roadmap

| Fase | Entrega |
|---|---|
| 0 | Repo, ADRs, esqueleto, CI, modelo de dados e seeds de alíquotas |
| 1 | Núcleo: Simples puro 2026–2033 (Anexos III/V + Fator R), testes golden |
| 2 | Lucro Presumido + transição CBS/IBS |
| 3 | Simples híbrido + comparador + recomendação com explicação |
| 4 | API completa (OpenAPI), front com gráficos e relatório comparativo |
| 5 | Deploy, README em PT/EN, vídeo/GIF de demo, post técnico |
| 6+ | Anexos I/II, indústria, ST, Lucro Real, import de XML, múltiplas atividades |

## 10. Riscos
- Regulamentação ainda em movimento: mitigar com tabelas versionadas, banner "premissas v.X" e `CENARIO`.
- Escopo: congelar o MVP em serviços/comércio.
- Precisão e arredondamento: Dinheiro como VO desde o dia 1.
- Responsabilidade: disclaimer visível e fontes citadas em cada linha de cálculo.
