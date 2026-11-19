import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { ApiProvider } from "../api/ApiProvider.tsx";
import { OptaApiClient } from "../api/client.ts";
import { API } from "./server.ts";

/** Renderiza com a API apontando para o MSW e um cache novo a cada teste (nada vaza entre testes). */
export function renderWithApi(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ApiProvider client={new OptaApiClient(API)} queryClient={queryClient}>
      {ui}
    </ApiProvider>,
  );
}
