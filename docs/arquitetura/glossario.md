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
| DAS (estratégia) | `DasStrategy` | Calcula e reparte o DAS do Simples |
| Faixa / tabela de anexo | `SimplesBracket`, `SimplesAnnexTable` | Teto de RBT12, alíquota nominal, parcela a deduzir |
| Partilha do DAS | `DasPartition` | Percentual de cada parcela; soma 100% |
| Fator R | `FatorR` | Folha ÷ RBT12; limite de 28% |
| Regra de anexo da atividade | `SimplesActivity` | `FixedAnnexActivity`, `PayrollFactorActivity` |
