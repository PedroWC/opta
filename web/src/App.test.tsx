import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { App } from "./App.tsx";

describe("RF-11: o aviso de simulador educacional aparece na tela inicial", () => {
  test("RF-11: mostra o título e deixa claro que não é consultoria tributária", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Opta" })).toBeInTheDocument();
    expect(screen.getByText("Não é consultoria tributária.")).toBeInTheDocument();
  });

  test("RNF-09: a página tem um único landmark principal", () => {
    render(<App />);
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });
});
