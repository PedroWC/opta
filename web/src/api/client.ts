import { NetworkError, ProblemDetailsError, UnexpectedResponseError } from "./errors.ts";
import type { Activity, ActivityPage, AssumptionsResponse, ServiceVersion, SimulationRequest, SimulationResponse } from "./types.ts";

type FetchFunction = (input: string, init?: RequestInit) => Promise<Response>;

interface RequestOptions {
  readonly body?: unknown;
  readonly signal?: AbortSignal | undefined;
}

/**
 * Cliente da API v1. Os dados da simulação trafegam por POST (nunca na URL, RNF-06). Não calcula nenhum
 * tributo: o backend é a única fonte de regra fiscal (ADR-0006).
 */
export class OptaApiClient {
  constructor(
    private readonly baseUrl: string = "",
    private readonly fetchFunction: FetchFunction = (input, init) => fetch(input, init),
  ) {}

  simulate(request: SimulationRequest, signal?: AbortSignal): Promise<SimulationResponse> {
    return this.send<SimulationResponse>("POST", "/v1/simulacoes", { body: request, signal });
  }

  assumptions(year?: number, signal?: AbortSignal): Promise<AssumptionsResponse> {
    const query = year === undefined ? "" : `?ano=${encodeURIComponent(String(year))}`;
    return this.send<AssumptionsResponse>("GET", `/v1/premissas/aliquotas${query}`, { signal });
  }

  activityByCnae(cnae: string, signal?: AbortSignal): Promise<Activity> {
    return this.send<Activity>("GET", `/v1/atividades?cnae=${encodeURIComponent(cnae)}`, { signal });
  }

  searchActivities(term: string, page = 1, pageSize = 10, signal?: AbortSignal): Promise<ActivityPage> {
    const query = `q=${encodeURIComponent(term)}&pagina=${page}&tamanho=${pageSize}`;
    return this.send<ActivityPage>("GET", `/v1/atividades?${query}`, { signal });
  }

  version(signal?: AbortSignal): Promise<ServiceVersion> {
    return this.send<ServiceVersion>("GET", "/v1/versao", { signal });
  }

  private async send<T>(method: "GET" | "POST", path: string, options: RequestOptions): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFunction(`${this.baseUrl}${path}`, {
        method,
        headers: {
          accept: "application/json, application/problem+json",
          ...(options.body === undefined ? {} : { "content-type": "application/json" }),
        },
        ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
        ...(options.signal ? { signal: options.signal } : {}),
      });
    } catch (error) {
      // Cancelamento pelo chamador (ex.: nova digitação) não é falha de rede. Checa o nome, pois o DOMException do
      // fetch pode vir de outra realm (jsdom/undici) e falhar em `instanceof`.
      if (options.signal?.aborted || (error instanceof Error && error.name === "AbortError")) throw error;
      throw new NetworkError();
    }
    if (!response.ok) throw await ProblemDetailsError.fromResponse(response);
    try {
      return (await response.json()) as T;
    } catch {
      throw new UnexpectedResponseError();
    }
  }
}
