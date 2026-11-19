import type { FieldProblem, ProblemBody } from "./types.ts";

/** Erro devolvido pela API em Problem Details (RFC 9457): código estável e, no 422, erros por campo (RNF-07). */
export class ProblemDetailsError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: readonly FieldProblem[];

  constructor(status: number, code: string, detail: string, fields: readonly FieldProblem[] = []) {
    super(detail);
    this.name = "ProblemDetailsError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  /** Lê a resposta de erro; se não vier em problem+json, devolve um erro genérico com o status HTTP. */
  static async fromResponse(response: Response): Promise<ProblemDetailsError> {
    const isProblem = (response.headers.get("content-type") ?? "").includes("application/problem+json");
    if (isProblem) {
      try {
        const body = (await response.json()) as Partial<ProblemBody>;
        if (typeof body.code === "string") {
          return new ProblemDetailsError(response.status, body.code, body.detail ?? body.title ?? "Erro na API.", body.errors ?? []);
        }
      } catch {
        // cai no erro genérico abaixo
      }
    }
    return new ProblemDetailsError(response.status, `HTTP-${response.status}`, "A API respondeu com um erro inesperado.");
  }

  /** Erro do cliente (4xx): repetir a mesma chamada não ajuda. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

/** Falha de rede ou servidor inalcançável (sem resposta). */
export class NetworkError extends Error {
  constructor() {
    super("Não foi possível falar com o servidor.");
    this.name = "NetworkError";
  }
}

/** Resposta de sucesso que não é JSON válido. */
export class UnexpectedResponseError extends Error {
  constructor() {
    super("A resposta da API não pôde ser lida.");
    this.name = "UnexpectedResponseError";
  }
}
