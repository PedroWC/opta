import { render, screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";
import { API, server } from "../test-utils/server.ts";
import { ApiProvider } from "./ApiProvider.tsx";
import { OptaApiClient } from "./client.ts";
import { ConnectedRoutes } from "./ConnectedRoutes.tsx";

const renderApp = () =>
  render(
    <ApiProvider client={new OptaApiClient(API)}>
      <MemoryRouter>
        <ConnectedRoutes />
      </MemoryRouter>
    </ApiProvider>,
  );

describe("RF-11: o rodapé mostra a versão das premissas informada pela API", () => {
  test("RF-11: depois de carregar, o rodapé mostra Premissas v2026.1", async () => {
    renderApp();
    const footer = screen.getByRole("contentinfo");
    expect(await within(footer).findByText(/Premissas v2026\.1\./)).toBeInTheDocument();
  });

  test("RF-11: se a API de versão falhar, o aviso legal continua sem a versão", async () => {
    server.use(http.get(`${API}/v1/versao`, () => HttpResponse.error()));
    renderApp();
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText(/Simulador educacional/)).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(within(footer).queryByText(/Premissas v/)).not.toBeInTheDocument();
  });
});
