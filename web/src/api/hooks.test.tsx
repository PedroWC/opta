import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { API, problem, server } from "../test-utils/server.ts";
import { requestFixture, versionFixture } from "../test-utils/fixtures.ts";
import { ApiProvider, shouldRetry } from "./ApiProvider.tsx";
import { OptaApiClient } from "./client.ts";
import { NetworkError, ProblemDetailsError } from "./errors.ts";
import { useActivity, useActivitySearch, useAssumptions, useServiceVersion, useSimulation } from "./hooks.ts";

const wrapper = ({ children }: { children: ReactNode }) => (
  <ApiProvider client={new OptaApiClient(API)}>{children}</ApiProvider>
);

describe("TanStack Query: hooks da API", () => {
  test("RF-07: useServiceVersion carrega a versão", async () => {
    const { result } = renderHook(() => useServiceVersion(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(versionFixture);
  });

  test("RF-04: useAssumptions carrega as premissas", async () => {
    const { result } = renderHook(() => useAssumptions(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.anos[0]?.ano).toBe(2026);
  });

  test("RF-01: useSimulation não consulta sem entrada e consulta quando recebe a entrada", async () => {
    const calls = vi.fn();
    server.use(http.post(`${API}/v1/simulacoes`, async () => { calls(); return HttpResponse.json((await import("../test-utils/fixtures.ts")).simulationFixture); }));
    const idle = renderHook(() => useSimulation(null), { wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
    expect(calls).not.toHaveBeenCalled();
    const loaded = renderHook(() => useSimulation(requestFixture), { wrapper });
    await waitFor(() => expect(loaded.result.current.isSuccess).toBe(true));
    expect(calls).toHaveBeenCalledTimes(1);
  });

  test("RNF-07: um 422 não é repetido e chega como ProblemDetailsError com os campos", async () => {
    const calls = vi.fn();
    server.use(http.post(`${API}/v1/simulacoes`, () => { calls(); return problem(422, "SIM-001", "Corrija os campos.", [{ pointer: "/uf", detail: "Campo obrigatório." }]); }));
    const { result } = renderHook(() => useSimulation(requestFixture), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ProblemDetailsError);
    expect((result.current.error as ProblemDetailsError).fields[0]?.pointer).toBe("/uf");
    expect(calls).toHaveBeenCalledTimes(1);
  });

  test("DEC-14: a busca de atividade só consulta com 2 ou mais caracteres", async () => {
    const calls = vi.fn();
    server.use(http.get(`${API}/v1/atividades`, () => { calls(); return HttpResponse.json({ itens: [], pagina: 1, tem_proxima: false }); }));
    const short = renderHook(() => useActivitySearch(" a "), { wrapper });
    expect(short.result.current.fetchStatus).toBe("idle");
    const enough = renderHook(() => useActivitySearch(" so "), { wrapper });
    await waitFor(() => expect(enough.result.current.isSuccess).toBe(true));
    expect(calls).toHaveBeenCalledTimes(1);
  });

  test("RF-05: useActivity só consulta quando há CNAE", async () => {
    const idle = renderHook(() => useActivity(null), { wrapper });
    expect(idle.result.current.fetchStatus).toBe("idle");
    const loaded = renderHook(() => useActivity("6201-5/01"), { wrapper });
    await waitFor(() => expect(loaded.result.current.isSuccess).toBe(true));
    expect(loaded.result.current.data?.cnae).toBe("6201-5/01");
  });

  test("RNF-07: a política de repetição só repete falha de rede, e uma vez", () => {
    expect(shouldRetry(0, new NetworkError())).toBe(true);
    expect(shouldRetry(1, new NetworkError())).toBe(false);
    expect(shouldRetry(0, new ProblemDetailsError(422, "SIM-001", "x"))).toBe(false);
    expect(shouldRetry(0, new ProblemDetailsError(500, "SIM-500", "x"))).toBe(false);
  });

  test("a ApiProvider aceita um QueryClient próprio", async () => {
    const queryClient = new QueryClient();
    const custom = ({ children }: { children: ReactNode }) => <ApiProvider client={new OptaApiClient(API)} queryClient={queryClient}>{children}</ApiProvider>;
    const { result } = renderHook(() => useServiceVersion(), { wrapper: custom });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryCache().getAll()).toHaveLength(1);
  });
});
