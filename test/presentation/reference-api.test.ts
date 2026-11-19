import { describe, expect, test } from "vitest";
import { CompositionRoot } from "../../src/composition-root.ts";

const handler = new CompositionRoot().httpServer.fetchHandler();
const get = (path: string): Promise<Response> => Promise.resolve(handler(new Request(`http://localhost${path}`)));

type Problem = { status: number; code: string; errors?: { pointer: string; detail: string }[] };
type Year = {
  ano: number;
  cbs: string;
  ibs: string;
  icms_iss_vigente_pct: number;
  pis_cofins_extinto: boolean;
  ano_de_teste: boolean;
};
type Activity = {
  cnae: string;
  descricao: string;
  natureza: string;
  anexo_simples?: string;
  usa_fator_r: boolean;
  presuncao_irpj: string;
  presuncao_csll: string;
};
type Page = { itens: Activity[]; pagina: number; tem_proxima: boolean };

const expectProblem = async (response: Response, status: number, code: string): Promise<Problem> => {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toContain("application/problem+json");
  const problem = (await response.json()) as Problem;
  expect(problem.code).toBe(code);
  return problem;
};

describe("RF-04: GET /v1/premissas/aliquotas", () => {
  test("RF-04: sem ano devolve os 8 anos em uma só chamada, com a versão das premissas", async () => {
    const response = await get("/v1/premissas/aliquotas");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { premissas_versao: string; anos: Year[] };
    expect(body.premissas_versao).toMatch(/^\d{4}\.\d+$/);
    expect(body.anos.map((y) => y.ano)).toEqual([2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]);
  });

  test("RN-02: 2026 é ano de teste (CBS 0,9% e IBS 0,1%) e PIS/Cofins ainda vigoram", async () => {
    const body = (await (await get("/v1/premissas/aliquotas?ano=2026")).json()) as { anos: Year[] };
    expect(body.anos).toEqual([
      { ano: 2026, cbs: "0.9000", ibs: "0.1000", icms_iss_vigente_pct: 100, pis_cofins_extinto: false, ano_de_teste: true },
    ]);
  });

  test("RN-02: 2029 tem IBS de 10% da referência (1,77%) e ICMS/ISS em 90%", async () => {
    const body = (await (await get("/v1/premissas/aliquotas?ano=2029")).json()) as { anos: Year[] };
    expect(body.anos[0]).toMatchObject({ cbs: "8.8000", ibs: "1.7700", icms_iss_vigente_pct: 90, pis_cofins_extinto: true, ano_de_teste: false });
  });

  test("RN-02: 2033 tem IBS pleno (17,7%) e ICMS/ISS extintos", async () => {
    const body = (await (await get("/v1/premissas/aliquotas?ano=2033")).json()) as { anos: Year[] };
    expect(body.anos[0]).toMatchObject({ ibs: "17.7000", icms_iss_vigente_pct: 0 });
  });

  test("RN-01: ano fora do horizonte ou que não é número é rejeitado com erro no campo ano", async () => {
    for (const bad of ["2025", "2034", "abc", "2026.5"]) {
      const problem = await expectProblem(await get(`/v1/premissas/aliquotas?ano=${bad}`), 422, "SIM-001");
      expect(problem.errors?.[0]?.pointer).toBe("/ano");
    }
  });
});

describe("RF-05: GET /v1/atividades?cnae=", () => {
  test("RF-05: atividade de serviço sujeita ao Fator R (Anexo V sem o fator) e presunção de 32%", async () => {
    const body = (await (await get("/v1/atividades?cnae=6201-5/01")).json()) as Activity;
    expect(body).toMatchObject({
      cnae: "6201-5/01",
      natureza: "SERVICO",
      anexo_simples: "V",
      usa_fator_r: true,
      presuncao_irpj: "32.0000",
      presuncao_csll: "32.0000",
    });
    expect(body.descricao.length).toBeGreaterThan(0);
  });

  test("RF-05: atividade de Anexo III fixo não usa o Fator R", async () => {
    const body = (await (await get("/v1/atividades?cnae=8630-5/04")).json()) as Activity;
    expect(body).toMatchObject({ anexo_simples: "III", usa_fator_r: false, natureza: "SERVICO" });
  });

  test("RF-05: comércio não tem anexo no MVP, e a presunção é de 8% (IRPJ) e 12% (CSLL)", async () => {
    const body = (await (await get("/v1/atividades?cnae=4711-3/02")).json()) as Activity;
    expect(body).toMatchObject({ natureza: "COMERCIO", usa_fator_r: false, presuncao_irpj: "8.0000", presuncao_csll: "12.0000" });
    expect(body.anexo_simples).toBeUndefined();
  });

  test("RF-05: CNAE fora do catálogo responde 404 (SIM-005)", async () => {
    await expectProblem(await get("/v1/atividades?cnae=0111-3/01"), 404, "SIM-005");
  });

  test("RN-09: CNAE fora do formato responde 422 com erro no campo cnae", async () => {
    const problem = await expectProblem(await get("/v1/atividades?cnae=6201501"), 422, "SIM-001");
    expect(problem.errors?.[0]?.pointer).toBe("/cnae");
  });

  test("RF-05: informar cnae e q juntos, ou nenhum, é erro de validação", async () => {
    await expectProblem(await get("/v1/atividades?cnae=6201-5/01&q=software"), 422, "SIM-001");
    await expectProblem(await get("/v1/atividades"), 422, "SIM-001");
  });
});

describe("DEC-14: GET /v1/atividades?q= (busca por texto, lista curta paginada)", () => {
  const search = async (query: string): Promise<Page> => {
    const response = await get(`/v1/atividades?${query}`);
    expect(response.status).toBe(200);
    return (await response.json()) as Page;
  };

  test("DEC-14: busca por trecho da descrição, sem diferenciar maiúsculas nem acentos", async () => {
    const page = await search("q=ODONTOLOGICA");
    expect(page.itens.map((a) => a.cnae)).toEqual(["8630-5/04"]);
    expect(page.tem_proxima).toBe(false);
  });

  test("DEC-14: busca por prefixo do código", async () => {
    const page = await search("q=6201");
    expect(page.itens.map((a) => a.cnae)).toEqual(["6201-5/01", "6201-5/02"]);
  });

  test("DEC-14: paginação (3 resultados, tamanho 2)", async () => {
    const first = await search("q=computador&tamanho=2");
    expect(first.itens).toHaveLength(2);
    expect(first).toMatchObject({ pagina: 1, tem_proxima: true });
    const second = await search("q=computador&tamanho=2&pagina=2");
    expect(second.itens).toHaveLength(1);
    expect(second).toMatchObject({ pagina: 2, tem_proxima: false });
  });

  test("DEC-14: busca sem resultado devolve lista vazia, não erro", async () => {
    expect(await search("q=zzzzzz")).toEqual({ itens: [], pagina: 1, tem_proxima: false });
  });

  test("RN-09: termo curto demais, página e tamanho inválidos são rejeitados", async () => {
    const short = await expectProblem(await get("/v1/atividades?q=a"), 422, "SIM-001");
    expect(short.errors?.[0]?.pointer).toBe("/q");
    await expectProblem(await get("/v1/atividades?q=software&pagina=0"), 422, "SIM-001");
    await expectProblem(await get("/v1/atividades?q=software&tamanho=21"), 422, "SIM-001");
  });
});

describe("RF-07: GET /v1/versao", () => {
  test("RF-07: devolve a versão do serviço e das premissas", async () => {
    const response = await get("/v1/versao");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { versao: string; premissas_versao: string };
    expect(body.versao).toMatch(/^\d+\.\d+\.\d+/);
    expect(body.premissas_versao).toMatch(/^\d{4}\.\d+$/);
  });
});
