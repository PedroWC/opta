# Casos de uso

## UC-01 — Simular regimes tributários
- **Ator:** empresário ou contador.
- **Pré-condição:** nenhuma (sem login no MVP).
- **Fluxo principal:** (1) informa faturamento, folha, CNAE, UF, perfil B2B/B2C e compras creditáveis; (2) o sistema valida a entrada (RN-09); (3) calcula cada regime em cada ano de 2026 a 2033 (RN-01 a RN-07); (4) compara e recomenda (RN-08); (5) exibe tabela, gráfico e memória de cálculo (RF-06).
- **Fluxos alternativos/exceção:** entrada inválida → erro 422 com código `SIM-001`; parâmetros sem vigência para um ano → erro `SIM-002`.
- **Requisitos:** RF-01, RF-02, RF-03, RF-06, RF-08.

## UC-02 — Consultar premissas de alíquotas
- **Ator:** qualquer usuário.
- **Fluxo principal:** informa o ano; o sistema devolve CBS, IBS, percentual de ICMS/ISS vigente e situação de PIS/Cofins (RN-02).
- **Requisitos:** RF-04.

## UC-03 — Consultar atividade por CNAE
- **Ator:** qualquer usuário.
- **Fluxo principal:** informa o CNAE; o sistema devolve anexo do Simples, aplicabilidade do Fator R e presunção do Lucro Presumido.
- **Requisitos:** RF-05.
