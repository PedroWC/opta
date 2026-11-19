import { readFileSync } from "node:fs";
import { join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, test } from "vitest";
import { parse } from "yaml";
import { activityFixture, activityPageFixture, assumptionsFixture, requestFixture, simulationFixture, versionFixture } from "../test-utils/fixtures.ts";

const spec = parse(readFileSync(join(__dirname, "../../../docs/api/openapi.yaml"), "utf8")) as { components: Record<string, unknown> };
const ajv = new Ajv2020({ strict: false, allErrors: true });

const conforms = (schema: string, value: unknown): string[] => {
  const check = ajv.compile({ components: spec.components, $ref: `#/components/schemas/${schema}` });
  return check(value) ? [] : (check.errors ?? []).map((e) => `${e.instancePath} ${e.message}`);
};

describe("RNF-03: as fixtures do front respeitam o contrato OpenAPI", () => {
  test.each([
    ["SimulacaoRequest", requestFixture],
    ["SimulacaoResponse", simulationFixture],
    ["PremissasResponse", assumptionsFixture],
    ["Atividade", activityFixture],
    ["AtividadesPagina", activityPageFixture],
    ["Versao", versionFixture],
  ])("%s", (schema, fixture) => {
    expect(conforms(schema, fixture)).toEqual([]);
  });

  test("o teste de conformidade detecta uma fixture fora do contrato", () => {
    expect(conforms("Versao", { versao: "1.0.0" }).length).toBeGreaterThan(0);
  });
});
