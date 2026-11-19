import { readFileSync } from "node:fs";
import { validate } from "@readme/openapi-parser";
import { parse } from "yaml";
import { describe, expect, test } from "vitest";

const SPEC_PATH = "docs/api/openapi.yaml";
const loadSpec = (): Record<string, unknown> => parse(readFileSync(SPEC_PATH, "utf8")) as Record<string, unknown>;

describe("RNF-03: o contrato OpenAPI 3.1 é válido e cobre os requisitos", () => {
  test("RNF-03: o documento é um OpenAPI 3.1 válido, com referências resolvidas", async () => {
    const result = await validate(SPEC_PATH);
    expect(result.valid).toBe(true);
    expect(loadSpec().openapi).toBe("3.1.0");
  });

  test("RNF-03: todas as rotas ficam sob /v1", () => {
    const paths = Object.keys(loadSpec().paths as object);
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) expect(path.startsWith("/v1/")).toBe(true);
  });

  test("RF-01, RF-04, RF-05, RF-07: as operações esperadas estão no contrato", () => {
    const paths = loadSpec().paths as Record<string, Record<string, { operationId: string }>>;
    expect(paths["/v1/simulacoes"]?.post?.operationId).toBe("simular");
    expect(paths["/v1/premissas/aliquotas"]?.get?.operationId).toBe("consultarAliquotas");
    expect(paths["/v1/atividades"]?.get?.operationId).toBe("consultarAtividades");
    expect(paths["/v1/versao"]?.get?.operationId).toBe("consultarVersao");
    expect(paths["/v1/health"]?.get?.operationId).toBe("consultarSaude");
  });

  test("RNF-07: os erros são application/problem+json com código SIM-nnn e erros por campo (DEC-14)", () => {
    const components = loadSpec().components as {
      schemas: { Problem: { required: string[]; properties: Record<string, { pattern?: string }> } };
      responses: Record<string, { content: Record<string, unknown> }>;
    };
    expect(components.schemas.Problem.required).toContain("code");
    expect(components.schemas.Problem.properties.code?.pattern).toBe("^SIM-\\d{3}$");
    expect(components.schemas.Problem.properties.errors).toBeDefined();
    for (const response of Object.values(components.responses)) {
      expect(Object.keys(response.content)).toEqual(["application/problem+json"]);
    }
  });

  test("RNF-02 (DEC-14): dinheiro e alíquotas são texto decimal, nunca number", () => {
    const schemas = (loadSpec().components as { schemas: Record<string, { type: string; pattern?: string }> }).schemas;
    for (const name of ["Dinheiro", "Aliquota"]) {
      expect(schemas[name]?.type).toBe("string");
      expect(schemas[name]?.pattern).toBeDefined();
    }
  });

  test("RF-03 (DEC-14): a simulação traz premissas_versao, avisos, recomendação e fator decisivo estruturado", () => {
    const schemas = loadSpec().components as {
      schemas: {
        SimulacaoResponse: { required: string[] };
        Recomendacao: { required: string[] };
        FatorDecisivo: { properties: { codigo: { enum: string[] } } };
      };
    };
    expect(schemas.schemas.SimulacaoResponse.required).toEqual(
      expect.arrayContaining(["premissas_versao", "avisos", "recomendacao", "regimes_indisponiveis"]),
    );
    expect(schemas.schemas.Recomendacao.required).toEqual(
      expect.arrayContaining(["motivo", "economia_acumulada", "fator_decisivo"]),
    );
    expect(schemas.schemas.FatorDecisivo.properties.codigo.enum).toEqual([
      "TRIBUTOS_SOBRE_RENDA",
      "ENCARGOS_SOBRE_FOLHA",
      "TRIBUTOS_SOBRE_CONSUMO",
      "NENHUM",
    ]);
  });

  test("DEC-14: busca de atividade por texto e premissas de todos os anos sem o parâmetro ano", () => {
    const paths = loadSpec().paths as Record<string, { get: { parameters: { name: string; required: boolean }[] } }>;
    const activityParams = paths["/v1/atividades"]?.get.parameters.map((p) => p.name);
    expect(activityParams).toEqual(expect.arrayContaining(["cnae", "q", "pagina", "tamanho"]));
    const year = paths["/v1/premissas/aliquotas"]?.get.parameters.find((p) => p.name === "ano");
    expect(year?.required).toBe(false);
  });
});
