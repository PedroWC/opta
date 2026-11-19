import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { activityFixture, activityPageFixture, assumptionsFixture, simulationFixture, versionFixture } from "./fixtures.ts";

export const API = "http://api.test";

/** Respostas padrão do MSW; cada teste pode sobrescrever com `server.use(...)`. */
export const defaultHandlers = [
  http.post(`${API}/v1/simulacoes`, () => HttpResponse.json(simulationFixture)),
  http.get(`${API}/v1/premissas/aliquotas`, () => HttpResponse.json(assumptionsFixture)),
  http.get(`${API}/v1/atividades`, ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(url.searchParams.has("cnae") ? activityFixture : activityPageFixture);
  }),
  http.get(`${API}/v1/versao`, () => HttpResponse.json(versionFixture)),
];

export const server = setupServer(...defaultHandlers);

/** Resposta de erro no formato Problem Details. */
export function problem(status: number, code: string, detail: string, errors?: Array<{ pointer: string; detail: string }>): Response {
  return HttpResponse.json(
    { type: "about:blank", title: "Erro", status, detail, code, ...(errors ? { errors } : {}) },
    { status, headers: { "content-type": "application/problem+json" } },
  );
}
