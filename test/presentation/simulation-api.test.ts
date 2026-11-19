import { Hono } from "hono";
import { describe, expect, test } from "vitest";
import { CompositionRoot } from "../../src/composition-root.ts";
import { ProblemDetailsHandler } from "../../src/presentation/problem-details-handler.ts";

const handler = new CompositionRoot().httpServer.fetchHandler();

const validBody = {
  cnae: "8630-5/04",
  uf: "SP",
  receita_bruta_anual: "300000.00",
  folha_anual: "0.00",
  perfil_clientes: { b2b_pct: 50 },
  compras_creditaveis_pct: 40,
  aliquota_icms_iss: "5.0000",
};

const post = (body: unknown, contentType = "application/json"): Promise<Response> =>
  Promise.resolve(
    handler(
      new Request("http://localhost/v1/simulacoes", {
        method: "POST",
        headers: { "content-type": contentType },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    ),
  );

type Problem = { status: number; code: string; errors?: { pointer: string; detail: string }[]; detail?: string };

describe("RF-01, RF-02, RF-03, RF-06: POST /v1/simulacoes devolve a simulação (golden)", () => {
  test("RF-02: 200 com 8 anos e três regimes em cada ano", async () => {
    const response = await post(validBody);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    const body = (await response.json()) as { anos: { ano: number; regimes: { regime: string }[]; melhor_regime: string }[] };
    expect(body.anos.map((a) => a.ano)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]);
    for (const year of body.anos) {
      expect(year.regimes.map((r) => r.regime)).toEqual(["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"]);
      expect(year.melhor_regime).toBe("SIMPLES");
    }
  });

  test("RF-06: valores como texto decimal e memória de cálculo com fonte (Simples em 2026: DAS de 24.240,00)", async () => {
    const body = (await (await post(validBody)).json()) as {
      anos: { regimes: { regime: string; carga_total: string; aliquota_efetiva: string; tributos: { codigo: string; base: string; aliquota: string; valor: string; fonte: string; detalhes?: { codigo: string; valor: string }[] }[] }[] }[];
    };
    const simples = body.anos[0]?.regimes[0];
    expect(simples?.carga_total).toBe("24240.00");
    expect(simples?.aliquota_efetiva).toBe("8.0800");
    const das = simples?.tributos[0];
    expect(das).toMatchObject({ codigo: "DAS", base: "300000.00", aliquota: "8.0800", valor: "24240.00" });
    expect(das?.fonte).toContain("Anexo III");
    expect(das?.detalhes?.map((d) => [d.codigo, d.valor])).toEqual([
      ["IRPJ", "969.60"],
      ["CSLL", "848.40"],
      ["CPP", "10520.16"],
      ["PIS_COFINS", "4145.04"],
      ["ISS", "7756.80"],
    ]);
  });

  test("RF-03: recomendação explicada (Simples, economia de 130.431,12, fator de consumo)", async () => {
    const body = (await (await post(validBody)).json()) as {
      premissas_versao: string;
      avisos: string[];
      regimes_indisponiveis: unknown[];
      recomendacao: { regime: string; motivo: string; economia_acumulada: string; segundo_colocado: string; fator_decisivo: { codigo: string; diferenca: string } };
    };
    expect(body.recomendacao).toMatchObject({
      regime: "SIMPLES",
      economia_acumulada: "130431.12",
      segundo_colocado: "SIMPLES_HIBRIDO",
      fator_decisivo: { codigo: "TRIBUTOS_SOBRE_CONSUMO", diferenca: "130431.12" },
    });
    expect(body.recomendacao.motivo.length).toBeGreaterThan(0);
    expect(body.premissas_versao).toMatch(/^\d{4}\.\d+$/);
    expect(body.avisos.length).toBeGreaterThan(0);
    expect(body.regimes_indisponiveis).toEqual([]);
  });

  test("RF-01: simula só os regimes pedidos", async () => {
    const body = (await (await post({ ...validBody, regimes: ["LUCRO_PRESUMIDO", "SIMPLES"] })).json()) as {
      anos: { regimes: { regime: string }[] }[];
    };
    expect(body.anos[0]?.regimes.map((r) => r.regime)).toEqual(["LUCRO_PRESUMIDO", "SIMPLES"]);
  });

  test("RN-04: receita acima do teto do Simples deixa os regimes do Simples em regimes_indisponiveis (SIM-003) e mantém o Lucro Presumido", async () => {
    const response = await post({ ...validBody, receita_bruta_anual: "5000000.00" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      regimes_indisponiveis: { regime: string; codigo: string }[];
      anos: { regimes: { regime: string }[] }[];
      recomendacao: { regime: string; segundo_colocado: string | null; economia_acumulada: string; fator_decisivo: { codigo: string } };
    };
    expect(body.regimes_indisponiveis.map((r) => [r.regime, r.codigo])).toEqual([
      ["SIMPLES", "SIM-003"],
      ["SIMPLES_HIBRIDO", "SIM-003"],
    ]);
    expect(body.anos[0]?.regimes.map((r) => r.regime)).toEqual(["LUCRO_PRESUMIDO"]);
    expect(body.recomendacao).toMatchObject({
      regime: "LUCRO_PRESUMIDO",
      segundo_colocado: null,
      economia_acumulada: "0.00",
      fator_decisivo: { codigo: "NENHUM" },
    });
  });
});

describe("RNF-07 e RN-09: entrada inválida responde 400/422 em Problem Details", () => {
  const expectProblem = async (response: Response, status: number, code: string): Promise<Problem> => {
    expect(response.status).toBe(status);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const problem = (await response.json()) as Problem;
    expect(problem.status).toBe(status);
    expect(problem.code).toBe(code);
    return problem;
  };

  test("400: JSON malformado (SIM-006)", async () => {
    await expectProblem(await post("{ não é json"), 400, "SIM-006");
  });

  test("400: tipo de conteúdo diferente de application/json (SIM-006)", async () => {
    await expectProblem(await post(JSON.stringify(validBody), "text/plain"), 400, "SIM-006");
  });

  test("400: corpo que não é um objeto (SIM-006)", async () => {
    await expectProblem(await post("[1, 2]"), 400, "SIM-006");
  });

  test("422: campos obrigatórios ausentes, com um erro por campo", async () => {
    const problem = await expectProblem(await post({ cnae: "8630-5/04" }), 422, "SIM-001");
    const pointers = problem.errors?.map((e) => e.pointer) ?? [];
    expect(pointers).toEqual(
      expect.arrayContaining(["/uf", "/receita_bruta_anual", "/folha_anual", "/perfil_clientes", "/compras_creditaveis_pct"]),
    );
  });

  test("RN-09: receita negativa", async () => {
    const problem = await expectProblem(await post({ ...validBody, receita_bruta_anual: "-1.00" }), 422, "SIM-001");
    expect(problem.errors).toEqual([{ pointer: "/receita_bruta_anual", detail: expect.stringContaining("negativ") }]);
  });

  test("RN-02/RNF-02: dinheiro como número (em vez de texto decimal) é rejeitado", async () => {
    const problem = await expectProblem(await post({ ...validBody, receita_bruta_anual: 300000 }), 422, "SIM-001");
    expect(problem.errors?.[0]?.pointer).toBe("/receita_bruta_anual");
  });

  test("RN-09: CNAE fora do formato", async () => {
    const problem = await expectProblem(await post({ ...validBody, cnae: "8630504" }), 422, "SIM-001");
    expect(problem.errors?.[0]?.pointer).toBe("/cnae");
  });

  test("RN-09: percentuais devem ser inteiros de 0 a 100", async () => {
    for (const bad of [101, -1, 50.5]) {
      const problem = await expectProblem(await post({ ...validBody, compras_creditaveis_pct: bad }), 422, "SIM-001");
      expect(problem.errors?.[0]?.pointer).toBe("/compras_creditaveis_pct");
    }
    const nested = await expectProblem(await post({ ...validBody, perfil_clientes: { b2b_pct: 101 } }), 422, "SIM-001");
    expect(nested.errors?.[0]?.pointer).toBe("/perfil_clientes/b2b_pct");
  });

  test("422: campos desconhecidos são rejeitados (nada é ignorado em silêncio)", async () => {
    const problem = await expectProblem(await post({ ...validBody, admin: true }), 422, "SIM-001");
    expect(problem.errors?.[0]?.pointer).toBe("/admin");
  });

  test("422: regime desconhecido ou lista vazia", async () => {
    await expectProblem(await post({ ...validBody, regimes: ["LUCRO_REAL"] }), 422, "SIM-001");
    await expectProblem(await post({ ...validBody, regimes: [] }), 422, "SIM-001");
  });

  test("422: alíquota de ICMS/ISS em formato inválido", async () => {
    const problem = await expectProblem(await post({ ...validBody, aliquota_icms_iss: "5%" }), 422, "SIM-001");
    expect(problem.errors?.[0]?.pointer).toBe("/aliquota_icms_iss");
  });

  test("422: atividade fora do escopo do MVP (SIM-004)", async () => {
    await expectProblem(await post({ ...validBody, cnae: "0111-3/01" }), 422, "SIM-004");
  });

  test("RNF-07: rota inexistente também responde em Problem Details (SIM-005)", async () => {
    const response = await handler(new Request("http://localhost/v1/nao-existe"));
    await expectProblem(response, 404, "SIM-005");
  });

  test("RNF-07: método não suportado na rota de simulação responde 404 em Problem Details", async () => {
    const response = await handler(new Request("http://localhost/v1/simulacoes"));
    await expectProblem(response, 404, "SIM-005");
  });

  test("RNF-06/RNF-07: erro inesperado responde 500 sem vazar a mensagem interna", async () => {
    const app = new Hono();
    app.get("/boom", () => {
      throw new Error("senha do banco: segredo123");
    });
    app.onError(new ProblemDetailsHandler().handle);
    const response = await app.fetch(new Request("http://localhost/boom"));
    const problem = await expectProblem(response, 500, "SIM-500");
    expect(JSON.stringify(problem)).not.toContain("segredo123");
  });
});
