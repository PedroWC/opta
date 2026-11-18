# Mapa do site e da API

## Telas (front-end, fase posterior)
1. **Simulador** — formulário de entrada (UC-01).
2. **Resultado** — tabela por ano e regime, gráfico, recomendação e memória de cálculo.
3. **Premissas** — alíquotas de transição por ano (UC-02).

## API `/v1` (backend)
| Método e rota | Caso de uso | Situação |
|---|---|---|
| `GET /v1/health` | RF-07 | Implementada |
| `POST /v1/simulacoes` | UC-01 | Backlog |
| `GET /v1/premissas/aliquotas?ano=` | UC-02 | Backlog |
| `GET /v1/atividades?cnae=` | UC-03 | Backlog |
