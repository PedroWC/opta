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
