import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import { CompositionRoot } from "../../src/composition-root.ts";

let workspace = "";
let handler: (request: Request) => Response | Promise<Response>;
let withoutSite: (request: Request) => Response | Promise<Response>;

beforeAll(() => {
  workspace = mkdtempSync(join(tmpdir(), "opta-site-"));
  const root = join(workspace, "dist");
  mkdirSync(join(root, "assets"), { recursive: true });
  writeFileSync(join(root, "index.html"), "<!doctype html><title>Opta</title><div id=root></div>");
  writeFileSync(join(root, "assets", "app-abc123.js"), "console.log('app');");
  writeFileSync(join(root, "assets", "app-abc123.css"), "body{margin:0}");
  writeFileSync(join(root, "favicon.ico"), "ico");
  writeFileSync(join(workspace, "segredo.txt"), "NAO-PODE-VAZAR");
  handler = new CompositionRoot(undefined, root).httpServer.fetchHandler();
  withoutSite = new CompositionRoot().httpServer.fetchHandler();
});

afterAll(() => rmSync(workspace, { recursive: true, force: true }));

const get = async (path: string, headers: Record<string, string> = {}): Promise<Response> =>
  Promise.resolve(handler(new Request(`http://localhost${path}`, { headers })));

describe("DEC-15: o front-end é servido pela mesma origem da API", () => {
  test("RF-08: a raiz devolve o index.html, sempre revalidado", async () => {
    const response = await get("/");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toContain("<div id=root>");
  });

  test("RNF-11: arquivos com hash em /assets/ são imutáveis e têm o tipo certo", async () => {
    const script = await get("/assets/app-abc123.js");
    expect(script.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
    expect(script.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect((await get("/assets/app-abc123.css")).headers.get("content-type")).toBe("text/css; charset=utf-8");
    expect((await get("/favicon.ico")).headers.get("cache-control")).toBe("no-cache");
  });

  test("RF-09: rotas da SPA (/resultado, /premissas) caem no index.html, com o fragmento fora da requisição", async () => {
    for (const path of ["/resultado", "/premissas", "/sobre", "/qualquer/rota/sem/extensao"]) {
      const response = await get(path);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain("<title>Opta</title>");
    }
  });

  test("RNF-07: arquivo inexistente e rota da API desconhecida respondem 404 em Problem Details, nunca HTML", async () => {
    for (const path of ["/assets/nao-existe.js", "/v1/nao-existe", "/v1/"]) {
      const response = await get(path);
      expect(response.status).toBe(404);
      expect(response.headers.get("content-type")).toContain("application/problem+json");
      expect(((await response.json()) as { code: string }).code).toBe("SIM-005");
    }
  });

  test("RNF-06: tentativas de sair da pasta do site não vazam arquivos", async () => {
    for (const path of ["/..%2fsegredo.txt", "/%2e%2e/segredo.txt", "/assets/..%2f..%2fsegredo.txt", "/assets/../../segredo.txt", "/%00", "/%E0%A4%A"]) {
      const response = await get(path);
      expect(await response.text()).not.toContain("NAO-PODE-VAZAR");
      expect([200, 404]).toContain(response.status);
    }
    expect((await get("/..%2fsegredo.txt")).status).toBe(404);
    expect((await get("/assets/..%2f..%2fsegredo.txt")).status).toBe(404);
  });

  test("DEC-15: a API continua funcionando ao lado do site", async () => {
    const response = await get("/v1/health");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "opta" });
  });

  test("sem OPTA_WEB_DIR a API não serve site: a raiz responde 404 em Problem Details", async () => {
    const response = await Promise.resolve(withoutSite(new Request("http://localhost/")));
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
  });

  test("somente GET serve o site: POST em rota da SPA não devolve HTML", async () => {
    const response = await Promise.resolve(handler(new Request("http://localhost/resultado", { method: "POST" })));
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
  });
});

describe("RNF-06 e RNF-12: cabeçalhos de segurança em todas as respostas", () => {
  const expectSecure = (response: Response): void => {
    const csp = response.headers.get("content-security-policy") ?? "";
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("connect-src 'self'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("permissions-policy")).toContain("camera=()");
    expect(response.headers.get("cross-origin-opener-policy")).toBe("same-origin");
  };

  test("RNF-06: página, asset, JSON da API e erro 404 têm os mesmos cabeçalhos", async () => {
    for (const path of ["/", "/assets/app-abc123.js", "/v1/health", "/v1/nao-existe"]) expectSecure(await get(path));
  });

  test("RNF-06: a simulação (POST) e os erros de validação também", async () => {
    const response = await Promise.resolve(
      handler(new Request("http://localhost/v1/simulacoes", { method: "POST", headers: { "content-type": "application/json" }, body: "{" })),
    );
    expect(response.status).toBe(400);
    expectSecure(response);
  });

  test("RNF-06: sem site configurado a API também envia os cabeçalhos", async () => {
    expectSecure(await Promise.resolve(withoutSite(new Request("http://localhost/v1/health"))));
  });
});

describe("RNF-11: compressão", () => {
  test("RNF-11: com Accept-Encoding gzip o HTML e o JSON saem comprimidos (quando grandes o bastante)", async () => {
    const big = "x".repeat(5000);
    writeFileSync(join(workspace, "dist", "assets", "grande-1.js"), `console.log("${big}");`);
    const script = await get("/assets/grande-1.js", { "accept-encoding": "gzip" });
    expect(script.headers.get("content-encoding")).toBe("gzip");
    const premises = await get("/v1/premissas/aliquotas", { "accept-encoding": "gzip" });
    expect(premises.status).toBe(200);
    expect(premises.headers.get("content-encoding")).toBe("gzip");
  });

  test("RNF-11: sem Accept-Encoding a resposta sai sem compressão", async () => {
    const response = await get("/assets/app-abc123.js");
    expect(response.headers.get("content-encoding")).toBeNull();
  });
});
