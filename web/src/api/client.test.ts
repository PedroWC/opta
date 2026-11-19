import { http, HttpResponse } from "msw";
import { describe, expect, test } from "vitest";
import { API, problem, server } from "../test-utils/server.ts";
import { activityFixture, assumptionsFixture, requestFixture, simulationFixture, versionFixture } from "../test-utils/fixtures.ts";
import { OptaApiClient } from "./client.ts";
import { NetworkError, ProblemDetailsError, UnexpectedResponseError } from "./errors.ts";

const client = new OptaApiClient(API);

describe("RF-01: simulate envia a entrada por POST, no corpo, e lê a resposta", () => {
  test("RNF-06: o corpo vai como JSON e a URL não carrega dados da simulação", async () => {
    let seen: { url: string; body: unknown; contentType: string | null } | undefined;
    server.use(
      http.post(`${API}/v1/simulacoes`, async ({ request }) => {
        seen = { url: request.url, body: await request.json(), contentType: request.headers.get("content-type") };
        return HttpResponse.json(simulationFixture);
      }),
    );
    expect(await client.simulate(requestFixture)).toEqual(simulationFixture);
    expect(seen?.url).toBe(`${API}/v1/simulacoes`);
    expect(seen?.body).toEqual(requestFixture);
    expect(seen?.contentType).toBe("application/json");
  });
});

describe("RF-04, RF-05, RF-07: consultas", () => {
  test("RF-04: assumptions sem ano chama a rota sem parâmetro; com ano, envia ?ano=", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/v1/premissas/aliquotas`, ({ request }) => {
        urls.push(request.url);
        return HttpResponse.json(assumptionsFixture);
      }),
    );
    await client.assumptions();
    await client.assumptions(2029);
    expect(urls).toEqual([`${API}/v1/premissas/aliquotas`, `${API}/v1/premissas/aliquotas?ano=2029`]);
  });

  test("RF-05: activityByCnae e searchActivities codificam os parâmetros na URL", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/v1/atividades`, ({ request }) => {
        urls.push(decodeURIComponent(request.url));
        return HttpResponse.json(activityFixture);
      }),
    );
    await client.activityByCnae("6201-5/01");
    await client.searchActivities("programas & web", 2, 5);
    expect(urls).toEqual([`${API}/v1/atividades?cnae=6201-5/01`, `${API}/v1/atividades?q=programas & web&pagina=2&tamanho=5`]);
  });

  test("RF-07: version lê a versão do serviço e das premissas", async () => {
    expect(await client.version()).toEqual(versionFixture);
  });
});

describe("RNF-07: erros viram exceções tipadas", () => {
  test("RNF-07: 422 em Problem Details traz status, código e erros por campo", async () => {
    server.use(
      http.post(`${API}/v1/simulacoes`, () =>
        problem(422, "SIM-001", "Corrija os campos indicados.", [{ pointer: "/receita_bruta_anual", detail: "Receita bruta anual negativa." }]),
      ),
    );
    const error = await client.simulate(requestFixture).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProblemDetailsError);
    const problemError = error as ProblemDetailsError;
    expect([problemError.status, problemError.code, problemError.message]).toEqual([422, "SIM-001", "Corrija os campos indicados."]);
    expect(problemError.fields).toEqual([{ pointer: "/receita_bruta_anual", detail: "Receita bruta anual negativa." }]);
    expect(problemError.isClientError).toBe(true);
  });

  test("RNF-07: 404 e 500 em Problem Details mantêm o código estável", async () => {
    server.use(
      http.get(`${API}/v1/atividades`, () => problem(404, "SIM-005", "Atividade não encontrado.")),
      http.get(`${API}/v1/versao`, () => problem(500, "SIM-500", "Ocorreu um erro inesperado.")),
    );
    const notFound = (await client.activityByCnae("0111-3/01").catch((e: unknown) => e)) as ProblemDetailsError;
    expect([notFound.status, notFound.code]).toEqual([404, "SIM-005"]);
    const internal = (await client.version().catch((e: unknown) => e)) as ProblemDetailsError;
    expect([internal.status, internal.code, internal.isClientError]).toEqual([500, "SIM-500", false]);
  });

  test("RNF-07: erro que não é problem+json vira erro genérico com o status HTTP", async () => {
    server.use(http.get(`${API}/v1/versao`, () => new HttpResponse("<html>Bad Gateway</html>", { status: 502, headers: { "content-type": "text/html" } })));
    const error = (await client.version().catch((e: unknown) => e)) as ProblemDetailsError;
    expect(error).toBeInstanceOf(ProblemDetailsError);
    expect([error.status, error.code]).toEqual([502, "HTTP-502"]);
    expect(error.message).not.toContain("Bad Gateway");
  });

  test("RNF-07: problem+json com corpo quebrado cai no erro genérico", async () => {
    server.use(http.get(`${API}/v1/versao`, () => new HttpResponse("{", { status: 500, headers: { "content-type": "application/problem+json" } })));
    const error = (await client.version().catch((e: unknown) => e)) as ProblemDetailsError;
    expect(error.code).toBe("HTTP-500");
  });

  test("RNF-07: sucesso com corpo que não é JSON vira UnexpectedResponseError", async () => {
    server.use(http.get(`${API}/v1/versao`, () => new HttpResponse("não é json", { status: 200 })));
    await expect(client.version()).rejects.toBeInstanceOf(UnexpectedResponseError);
  });

  test("RNF-07: falha de rede vira NetworkError, sem vazar a causa", async () => {
    server.use(http.get(`${API}/v1/versao`, () => HttpResponse.error()));
    const error = await client.version().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NetworkError);
    expect((error as Error).message).toBe("Não foi possível falar com o servidor.");
  });

  test("RNF-07: a requisição cancelada propaga o AbortError (não é falha de rede)", async () => {
    server.use(http.get(`${API}/v1/versao`, async () => { await new Promise((resolve) => setTimeout(resolve, 50)); return HttpResponse.json(versionFixture); }));
    const controller = new AbortController();
    const pending = client.version(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });
});
