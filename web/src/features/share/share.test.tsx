import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { AppRoutes } from "../../app/AppRoutes.tsx";
import { expectNoA11yViolations } from "../../test-utils/axe.ts";
import { requestFixture } from "../../test-utils/fixtures.ts";
import { renderWithApi } from "../../test-utils/render.tsx";
import { resultLocation } from "../../test-utils/routes.ts";
import { decodeFragment, encodeRequest, valuesOf } from "./inputUrlCodec.ts";

const b64 = (text: string): string => btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const fragmentOf = (value: unknown): string => `v1.${b64(JSON.stringify(value))}`;

describe("RF-09: codec do fragmento da URL", () => {
  test("RF-09: ida e volta devolve exatamente a mesma entrada", () => {
    const encoded = encodeRequest(requestFixture);
    expect(encoded.startsWith("v1.")).toBe(true);
    expect(encoded).toMatch(/^v1\.[A-Za-z0-9_-]+$/); // só caracteres seguros para URL
    // A entrada de exemplo não traz `regimes`; ao decodificar, o padrão são os três regimes (explícitos).
    const expected = { ...requestFixture, regimes: ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"] };
    expect(decodeFragment(`#${encoded}`)).toEqual({ status: "valid", request: expected });
    expect(decodeFragment(encoded)).toEqual({ status: "valid", request: expected });
  });

  test("RF-09: preserva todos os campos, inclusive regimes e alíquota", () => {
    const request = { ...requestFixture, regimes: ["SIMPLES" as const, "LUCRO_PRESUMIDO" as const], aliquota_icms_iss: "2.5000" };
    const decoded = decodeFragment(encodeRequest(request));
    expect(decoded.status === "valid" && decoded.request.regimes).toEqual(["SIMPLES", "LUCRO_PRESUMIDO"]);
    expect(decoded.status === "valid" && decoded.request.aliquota_icms_iss).toBe("2.5000");
  });

  test("RF-09: fragmento vazio é 'empty'; sem regimes no link assume os três", () => {
    expect(decodeFragment("")).toEqual({ status: "empty" });
    expect(decodeFragment("#")).toEqual({ status: "empty" });
    const withoutRegimes = { ...requestFixture, regimes: undefined }; // JSON.stringify descarta a chave
    const decoded = decodeFragment(fragmentOf(withoutRegimes));
    expect(decoded.status === "valid" && decoded.request.regimes).toEqual(["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"]);
  });

  test("RNF-12: link adulterado ou lixo nunca derruba: base64 inválido, prefixo errado, JSON quebrado, não objeto", () => {
    for (const bad of ["v1.%%%", "v2.abc", "abc", `v1.${b64("{")}`, `v1.${b64("[1,2]")}`, `v1.${b64("null")}`, `v1.${b64('"texto"')}`]) {
      expect(decodeFragment(bad)).toEqual({ status: "invalid", values: {} });
    }
  });

  test("RNF-12: fragmento gigante é recusado sem decodificar", () => {
    expect(decodeFragment(`v1.${"A".repeat(3000)}`)).toEqual({ status: "invalid", values: {} });
  });

  test("RF-09: com campos inválidos devolve só os válidos para preencher o formulário", () => {
    const decoded = decodeFragment(fragmentOf({ ...requestFixture, receita_bruta_anual: "-5.00", uf: "ZZ", compras_creditaveis_pct: 400 }));
    expect(decoded.status).toBe("invalid");
    const values = valuesOf(decoded);
    expect(values).toMatchObject({ cnae: "8630-5/04", payroll: "0.00", b2b: "50", issRate: "5,00" });
    expect(values).not.toHaveProperty("revenue");
    expect(values).not.toHaveProperty("uf");
    expect(values).not.toHaveProperty("purchases");
  });

  test("RNF-12: tipos errados (número no lugar de texto, texto no lugar de número) são descartados", () => {
    const decoded = decodeFragment(fragmentOf({ cnae: 123, uf: "SP", receita_bruta_anual: 1000, perfil_clientes: { b2b_pct: "70" }, regimes: ["SIMPLES", "OUTRO"] }));
    expect(decoded.status).toBe("invalid");
    expect(valuesOf(decoded)).toEqual({ uf: "SP", regimes: ["SIMPLES"] });
  });

  test("RF-09: valuesOf de um valor válido reconstrói o formulário e de vazio não preenche nada", () => {
    expect(valuesOf(decodeFragment(encodeRequest(requestFixture)))).toMatchObject({ cnae: "8630-5/04", revenue: "300000.00" });
    expect(valuesOf({ status: "empty" })).toEqual({});
  });

  test("RNF-12: acentos e caracteres fora do ASCII sobrevivem à ida e volta (UTF-8)", () => {
    const decoded = decodeFragment(fragmentOf({ ...requestFixture, uf: "SP" }));
    expect(decoded.status).toBe("valid");
    expect(decodeFragment(`v1.${btoa(String.fromCharCode(0xff, 0xfe))}`)).toEqual({ status: "invalid", values: {} });
  });
});

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.hash}`}</p>;
}

const renderApp = (entry: string | { pathname: string; hash?: string }) =>
  renderWithApi(
    <MemoryRouter initialEntries={[entry]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  );

describe("RF-09: o estado da simulação vive no fragmento da URL", () => {
  test("RF-09: enviar o formulário vai para /resultado#v1.… e mostra o resultado", async () => {
    renderApp("/");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Preencher com um exemplo" }));
    await user.click(screen.getByRole("button", { name: "Simular regimes" }));
    expect(await screen.findByRole("heading", { name: "Fique no Simples Nacional" })).toBeInTheDocument();
    expect(screen.getByTestId("location").textContent).toMatch(/^\/resultado#v1\.[A-Za-z0-9_-]+$/);
  });

  test("US-07: abrir o link em outro lugar mostra a mesma simulação", async () => {
    renderApp(resultLocation());
    expect(await screen.findByRole("heading", { name: "Fique no Simples Nacional" })).toBeInTheDocument();
    expect(screen.getByText(/CNAE 8630-5\/04 · SP · Receita R\$ 300\.000,00 · 50% B2B/)).toBeInTheDocument();
  });

  test("US-07: link com dado inválido cai no formulário com aviso e os campos válidos preenchidos", async () => {
    renderApp({ pathname: "/resultado", hash: `#${fragmentOf({ ...requestFixture, receita_bruta_anual: "abc" })}` });
    expect(await screen.findByText("Alguns dados do link não puderam ser usados")).toBeInTheDocument();
    expect(screen.getByLabelText(/Atividade \(CNAE\)/)).toHaveValue("8630-5/04");
    expect(screen.getByLabelText(/Receita bruta anual/)).toHaveValue("");
    expect(screen.getByTestId("location").textContent).toMatch(/^\/#v1\./);
  });

  test("US-07: link ilegível (lixo) também volta ao formulário com aviso, sem campos", async () => {
    renderApp({ pathname: "/resultado", hash: "#qualquer-coisa" });
    expect(await screen.findByText("Alguns dados do link não puderam ser usados")).toBeInTheDocument();
    expect(screen.getByLabelText(/Receita bruta anual/)).toHaveValue("");
  });

  test("RF-09: 'Ajustar dados' volta ao formulário preenchido e mantém o fragmento", async () => {
    renderApp(resultLocation());
    await userEvent.click(await screen.findByRole("link", { name: "Ajustar dados" }));
    expect(await screen.findByLabelText(/Receita bruta anual/)).toHaveValue("300.000,00");
    expect(screen.getByTestId("location").textContent).toMatch(/^\/#v1\./);
    expect(screen.queryByText("Alguns dados do link não puderam ser usados")).not.toBeInTheDocument();
  });

  test("RNF-12: a simulação nunca vai para a URL de API (corpo no POST) nem para o servidor de hospedagem (fragmento)", async () => {
    renderApp(resultLocation());
    await screen.findByRole("heading", { name: "Fique no Simples Nacional" });
    expect(screen.getByTestId("location").textContent).toContain("#v1.");
    expect(new URL(`http://app.test${screen.getByTestId("location").textContent}`).search).toBe("");
  });
});

describe("US-07: copiar link", () => {
  const withClipboard = (writeText: (text: string) => Promise<void>) =>
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

  test("US-07: copia o endereço atual e confirma em região de status, avisando que contém os números", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    withClipboard(writeText);
    renderApp(resultLocation());
    await userEvent.click(await screen.findByRole("button", { name: "Copiar link" }));
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findAllByText("Link copiado. Ele contém os números que você digitou.")).not.toHaveLength(0);
    expect(screen.getByText("O link contém os números que você digitou; compartilhe com cuidado.")).toBeInTheDocument();
  });

  test("US-07: se a área de transferência não estiver disponível, orienta a copiar da barra de endereço", async () => {
    withClipboard(() => Promise.reject(new Error("negado")));
    renderApp(resultLocation());
    await userEvent.click(await screen.findByRole("button", { name: "Copiar link" }));
    expect((await screen.findAllByText(/Copie o endereço na barra do navegador/)).length).toBeGreaterThan(0);
  });

  test("RNF-09: a tela de resultado com o botão não tem violações do axe", async () => {
    const view = renderApp(resultLocation());
    await screen.findByRole("heading", { name: "Fique no Simples Nacional" });
    expect(within(view.container).getByRole("button", { name: "Copiar link" })).toBeInTheDocument();
    await expectNoA11yViolations(view.container);
  });
});
