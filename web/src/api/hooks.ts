import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "./ApiProvider.tsx";
import type { SimulationRequest } from "./types.ts";

const TEN_MINUTES = 10 * 60 * 1000;

/** Simulação como consulta: não altera estado no servidor, então a chave é a entrada e o cache não expira. */
export function useSimulation(request: SimulationRequest | null) {
  const client = useApiClient();
  return useQuery({
    queryKey: ["simulation", request],
    queryFn: ({ signal }) => client.simulate(request as SimulationRequest, signal),
    enabled: request !== null,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** Premissas de um ano ou, sem ano, de todos (uma chamada só). */
export function useAssumptions(year?: number) {
  const client = useApiClient();
  return useQuery({
    queryKey: ["assumptions", year ?? "all"],
    queryFn: ({ signal }) => client.assumptions(year, signal),
    staleTime: TEN_MINUTES,
  });
}

/** Busca por texto: só com 2 ou mais caracteres; a requisição anterior é cancelada pelo sinal do TanStack. */
export function useActivitySearch(term: string, page = 1) {
  const client = useApiClient();
  const trimmed = term.trim();
  return useQuery({
    queryKey: ["activities", "search", trimmed, page],
    queryFn: ({ signal }) => client.searchActivities(trimmed, page, 10, signal),
    enabled: trimmed.length >= 2,
    staleTime: TEN_MINUTES,
  });
}

export function useActivity(cnae: string | null) {
  const client = useApiClient();
  return useQuery({
    queryKey: ["activities", "cnae", cnae],
    queryFn: ({ signal }) => client.activityByCnae(cnae as string, signal),
    enabled: cnae !== null,
    staleTime: TEN_MINUTES,
  });
}

export function useServiceVersion() {
  const client = useApiClient();
  return useQuery({
    queryKey: ["version"],
    queryFn: ({ signal }) => client.version(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
