# Glossário (domínio fiscal ⇄ código)

Documentação em português; identificadores de código em inglês. Nomes próprios de regimes ficam no original.

| Termo | Identificador | Observação |
|---|---|---|
| Dinheiro | `Money` | Centavos em `bigint` |
| Alíquota | `TaxRate` | Milionésimos em `bigint` |
| Ano de apuração | `TaxYear` | 2026–2033 |
| Perfil da empresa (entrada) | `CompanyProfile` | Validado na construção |
| Regime tributário | `TaxRegime` | Classe abstrata (Template Method) |
| Simples Nacional / Simples híbrido / Lucro Presumido | `SimplesNacional`, `SimplesHibrido`, `LucroPresumido` | Nomes próprios |
| Tributo (estratégia) | `TaxStrategy` | Uma classe por tributo |
| Linha da memória de cálculo | `TaxLine` | Base, alíquota, valor, fonte |
| Resultado anual | `AnnualResult` | Linhas e carga total |
| Tabela de alíquotas | `TaxRateTableRepository` | Porta; vigência por ano |
| Vigência | `EffectivePeriod…` | Erro quando ausente |
| CBS / IBS / ICMS / ISS / PIS-Cofins (estratégias) | `CbsStrategy`, `IbsStrategy`, `IcmsStrategy`, `IssStrategy`, `PisCofinsStrategy` | CBS, IBS e ICMS herdam de `NonCumulativeConsumptionTax` (débito menos crédito) |
| IRPJ / CSLL / CPP (estratégias) | `IrpjStrategy`, `CsllStrategy`, `CppStrategy` | Lucro Presumido; parâmetros por vigência |
| Presunção / natureza da atividade | `Presumption`, `ActivityKind` | Serviço (ISS) ou comércio (ICMS) |
| DAS híbrido | `HybridDasStrategy` | DAS puro sem as parcelas de CBS/IBS |
| Crédito ao cliente B2B | `CustomerCreditPolicy` | `EmbeddedCustomerCredit` (puro) e `FullCustomerCredit` (híbrido) |
| Comparação / recomendação | `RegimeComparison`, `Recommendation`, `DecisiveFactor` | Menor carga no ano e acumulada; fator decisivo por categoria |
| API de simulações | `SimulationController`, `SimulationRequestValidator`, `SimulationResponseMapper` | Borda HTTP; `RunSimulationUseCase` na aplicação |
| Atividade / catálogo | `Activity`, `ActivityPage`, `ActivityReferenceCatalog` | CNAE com natureza, regra de Simples e presunção; catálogo provisório |
| Execução de SQL | `SqlExecutor` | Porta com `SqliteSqlExecutor` e `OracleSqlExecutor`; bind variables |
| Repositório SQL | `SqlTaxRateTableRepository` | Mesma porta `TaxRateTableRepository`, tabelas com vigência |
| DAS (estratégia) | `DasStrategy` | Calcula e reparte o DAS do Simples |
| Faixa / tabela de anexo | `SimplesBracket`, `SimplesAnnexTable` | Teto de RBT12, alíquota nominal, parcela a deduzir |
| Partilha do DAS | `DasPartition` | Percentual de cada parcela; soma 100% |
| Fator R | `FatorR` | Folha ÷ RBT12; limite de 28% |
| Regra de anexo da atividade | `SimplesActivity` | `FixedAnnexActivity`, `PayrollFactorActivity` |
