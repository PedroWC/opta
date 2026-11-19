# Mapa do site e da API

## Telas (front-end, fase posterior)
1. **Simulador** — formulário de entrada (UC-01).
2. **Resultado** — tabela por ano e regime, gráfico, recomendação e memória de cálculo.
3. **Premissas** — alíquotas de transição por ano (UC-02) e consulta de CNAE (UC-03).
4. **Metodologia** (`/sobre`) — fontes legais, limites do MVP e aviso legal (RF-11).

Rotas do front-end: `/`, `/resultado#v1.<dados>` (estado no fragmento da URL, versionado e em base64url, RF-09), `/#v1.<dados>` (formulário reaberto por "Ajustar dados" ou por um link) e `/?cnae=6201-5/01` (atalho da página de premissas, que só preenche o CNAE, um código público), `/premissas`, `/sobre`. Detalhes em [plano do front-end](../frontend/plano-frontend.md) e [wireframes](../prototipos/wireframes-simulador.md).

## API `/v1` (backend)
| Método e rota | Caso de uso | Situação |
|---|---|---|
| `GET /v1/health` | RF-07 | Implementada |
| `POST /v1/simulacoes` | UC-01 | Backlog |
| `GET /v1/premissas/aliquotas?ano=` | UC-02 | Backlog |
| `GET /v1/atividades?cnae=` | UC-03 | Backlog |
