import Ajv2020 from "ajv/dist/2020.js";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";
import { CompositionRoot } from "../../src/composition-root.ts";

type Schema = Record<string, unknown>;
type Spec = { components: Record<string, unknown> };

/** O schema Dinheiro/Aliquota é recursivo (LinhaTributo.detalhes), então os $ref são resolvidos pelo Ajv. */
const spec = parse(readFileSync("docs/api/openapi.yaml", "utf8")) as Spec;
const schemaOf = (name: string): Schema => ({ components: spec.components, $ref: `#/components/schemas/${name}` });

const ajv = new Ajv2020({ strict: false, allErrors: true });
const handler = new CompositionRoot().httpServer.fetchHandler();

const body = {
  cnae: "6201-5/01",
  uf: "SP",
  receita_bruta_anual: "1800000.00",
  folha_anual: "540000.00",
  perfil_clientes: { b2b_pct: 70 },
  compras_creditaveis_pct: 25,
  aliquota_icms_iss: "5.0000",
};

const simulate = (payload: unknown): Promise<Response> =>
  Promise.resolve(
    handler(
      new Request("http://localhost/v1/simulacoes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    ),
  );

const validate = (schema: Schema, value: unknown): string[] => {
  const check = ajv.compile(schema);
  return check(value) ? [] : (check.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
};

describe("RNF-03: a API responde conforme o contrato OpenAPI", () => {
  test("RF-01: a resposta 200 de POST /v1/simulacoes valida contra o schema do contrato", async () => {
        const response = await simulate(body);
    expect(response.status).toBe(200);
    expect(validate(schemaOf("SimulacaoResponse"), await response.json())).toEqual([]);
  });

  test("RF-01: a resposta 200 com regimes indisponíveis também valida contra o contrato", async () => {
    const response = await simulate({ ...body, receita_bruta_anual: "5000000.00" });
    expect(validate(schemaOf("SimulacaoResponse"), await response.json())).toEqual([]);
  });

  test("RNF-07: os erros 400 e 422 validam contra o schema Problem do contrato", async () => {
    const malformed = await Promise.resolve(
      handler(new Request("http://localhost/v1/simulacoes", { method: "POST", headers: { "content-type": "application/json" }, body: "{" })),
    );
    expect(malformed.status).toBe(400);
    expect(validate(schemaOf("Problem"), await malformed.json())).toEqual([]);

    const invalid = await simulate({ ...body, receita_bruta_anual: "-1.00" });
    expect(invalid.status).toBe(422);
    expect(validate(schemaOf("Problem"), await invalid.json())).toEqual([]);
  });

  const getJson = async (path: string): Promise<{ status: number; body: unknown }> => {
    const response = await Promise.resolve(handler(new Request(`http://localhost${path}`)));
    return { status: response.status, body: await response.json() };
  };

  test("RF-04: GET /v1/premissas/aliquotas valida contra o contrato (todos os anos e um ano)", async () => {
    for (const path of ["/v1/premissas/aliquotas", "/v1/premissas/aliquotas?ano=2029"]) {
      const { status, body } = await getJson(path);
      expect(status).toBe(200);
      expect(validate(schemaOf("PremissasResponse"), body)).toEqual([]);
    }
  });

  test("RF-05: GET /v1/atividades valida contra o contrato (consulta exata, comércio e busca paginada)", async () => {
    for (const [path, schema] of [
      ["/v1/atividades?cnae=6201-5/01", "Atividade"],
      ["/v1/atividades?cnae=4711-3/02", "Atividade"],
      ["/v1/atividades?q=computador&tamanho=2", "AtividadesPagina"],
    ] as const) {
      const { status, body } = await getJson(path);
      expect(status).toBe(200);
      expect(validate(schemaOf(schema), body)).toEqual([]);
    }
  });

  test("RF-07: GET /v1/versao e /v1/health validam contra o contrato", async () => {
    expect(validate(schemaOf("Versao"), (await getJson("/v1/versao")).body)).toEqual([]);
    expect(validate(schemaOf("Saude"), (await getJson("/v1/health")).body)).toEqual([]);
  });

  test("RNF-07: 404 e 422 das rotas de leitura validam contra o schema Problem", async () => {
    for (const path of ["/v1/atividades?cnae=0111-3/01", "/v1/atividades?cnae=abc", "/v1/premissas/aliquotas?ano=1999"]) {
      const { body } = await getJson(path);
      expect(validate(schemaOf("Problem"), body)).toEqual([]);
    }
  });
});
