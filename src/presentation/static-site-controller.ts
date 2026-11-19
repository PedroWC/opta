import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import type { Context } from "hono";

/**
 * Serve o front-end construído (`web/dist`) pela mesma origem da API (DEC-15): sem CORS e com os mesmos cabeçalhos.
 * Rotas da SPA (sem extensão) caem no `index.html`; arquivos inexistentes e caminhos fora da pasta dão 404.
 */
export class StaticSiteController {
  private static readonly CONTENT_TYPES: Readonly<Record<string, string>> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".map": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".txt": "text/plain; charset=utf-8",
    ".woff2": "font/woff2",
  };

  private readonly root: string;

  constructor(rootDirectory: string) {
    this.root = resolve(rootDirectory);
  }

  /** Devolve a resposta do arquivo ou `null` quando não há o que servir (o chamador responde 404). */
  handle = async (c: Context): Promise<Response | null> => {
    const pathname = this.decode(new URL(c.req.url).pathname);
    if (pathname === null) return null;
    const target = resolve(this.root, `.${pathname}`);
    if (target !== this.root && !target.startsWith(this.root + sep)) return null;

    const file = await this.fileAt(target);
    if (file) return this.respond(file, pathname.startsWith("/assets/"));
    // Rota da SPA (ex.: /resultado): sem extensão, devolve o index.html; o React Router decide a tela.
    if (extname(pathname) === "") {
      const index = await this.fileAt(resolve(this.root, "index.html"));
      if (index) return this.respond(index, false);
    }
    return null;
  };

  private decode(pathname: string): string | null {
    try {
      const decoded = decodeURIComponent(pathname);
      return decoded.includes("\0") ? null : decoded;
    } catch {
      return null;
    }
  }

  private async fileAt(path: string): Promise<{ path: string; content: Buffer } | null> {
    try {
      if (!(await stat(path)).isFile()) return null;
      return { path, content: await readFile(path) };
    } catch {
      return null;
    }
  }

  private respond(file: { path: string; content: Buffer }, hashedAsset: boolean): Response {
    const type = StaticSiteController.CONTENT_TYPES[extname(file.path).toLowerCase()] ?? "application/octet-stream";
    return new Response(new Uint8Array(file.content), {
      headers: {
        "content-type": type,
        // Arquivos com hash no nome nunca mudam; o resto (index.html) é sempre revalidado.
        "cache-control": hashedAsset ? "public, max-age=31536000, immutable" : "no-cache",
      },
    });
  }
}
