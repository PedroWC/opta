import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { OptaApiClient } from "./client.ts";
import { NetworkError } from "./errors.ts";
import { ProblemDetailsError } from "./errors.ts";

const ApiClientContext = createContext<OptaApiClient | null>(null);

export function useApiClient(): OptaApiClient {
  const client = useContext(ApiClientContext);
  if (!client) throw new Error("useApiClient exige o ApiProvider.");
  return client;
}

/** Erro do cliente (4xx) não se repete; falha de rede tenta mais uma vez. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ProblemDetailsError && error.isClientError) return false;
  return error instanceof NetworkError && failureCount < 1;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, refetchOnWindowFocus: false } } });
}

type Props = { client: OptaApiClient; queryClient?: QueryClient; children: ReactNode };

export function ApiProvider({ client, queryClient, children }: Props) {
  const [defaultQueryClient] = useState(createQueryClient);
  return (
    <ApiClientContext.Provider value={client}>
      <QueryClientProvider client={queryClient ?? defaultQueryClient}>{children}</QueryClientProvider>
    </ApiClientContext.Provider>
  );
}
