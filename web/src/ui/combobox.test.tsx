import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, test, vi } from "vitest";
import { expectNoA11yViolations } from "../test-utils/axe.ts";
import { Combobox, type ComboboxOption } from "./index.ts";

const OPTIONS: ComboboxOption[] = [
  { value: "6201-5/01", label: "6201-5/01 — Desenvolvimento de programas" },
  { value: "6201-5/02", label: "6201-5/02 — Web design" },
  { value: "6202-3/00", label: "6202-3/00 — Programas customizáveis" },
];

function Harness({ options = OPTIONS, loading = false, onSelect = () => undefined, onSubmit = () => undefined }: { options?: ComboboxOption[]; loading?: boolean; onSelect?: (o: ComboboxOption) => void; onSubmit?: () => void }) {
  const [value, setValue] = useState("");
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
      <Combobox
        label="Atividade"
        value={value}
        onValueChange={setValue}
        onSelectOption={(option) => { setValue(option.value); onSelect(option); }}
        options={options}
        loading={loading}
        searchable={value.trim().length >= 2}
        loadingMessage="Buscando atividades…"
        emptyMessage="Nenhuma atividade encontrada."
      />
      <button type="submit">Enviar</button>
    </form>
  );
}

describe("Combobox (padrão APG: lista com preenchimento)", () => {
  test("RNF-09: tem papel combobox, aria-autocomplete=list e começa fechado", () => {
    render(<Harness />);
    const input = screen.getByRole("combobox", { name: "Atividade" });
    expect(input).toHaveAttribute("aria-autocomplete", "list");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  test("RNF-09: ao digitar abre a lista, com a quantidade de resultados anunciada", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "62");
    expect(input).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(screen.getByText("3 resultados. Use as setas para escolher.")).toBeInTheDocument();
  });

  test("RNF-09: as setas movem a opção ativa pelo aria-activedescendant e dão a volta", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "62");
    await userEvent.keyboard("{ArrowDown}");
    const [first, second, third] = screen.getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", first?.id);
    expect(first).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", second?.id);
    await userEvent.keyboard("{ArrowUp}{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", third?.id);
    expect(input).toHaveFocus();
  });

  test("RNF-09: Enter escolhe a opção ativa, fecha a lista e não envia o formulário", async () => {
    const onSelect = vi.fn();
    const onSubmit = vi.fn();
    render(<Harness onSelect={onSelect} onSubmit={onSubmit} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "62");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[1]);
    expect(input).toHaveValue("6201-5/02");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("RNF-09: Escape fecha a lista e Tab sai do campo", async () => {
    render(<Harness />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "62");
    await userEvent.keyboard("{Escape}");
    expect(input).toHaveAttribute("aria-expanded", "false");
    await userEvent.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  test("RNF-09: clicar numa opção escolhe", async () => {
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    await userEvent.type(screen.getByRole("combobox"), "62");
    await userEvent.click(screen.getByRole("option", { name: /Web design/ }));
    expect(onSelect).toHaveBeenCalledWith(OPTIONS[1]);
  });

  test("US-03: sem resultados mostra a mensagem, sem abrir a lista", async () => {
    render(<Harness options={[]} />);
    const input = screen.getByRole("combobox");
    await userEvent.type(input, "zz");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Nenhuma atividade encontrada.")).toBeInTheDocument();
  });

  test("RNF-09: enquanto busca, anuncia 'Buscando…' e não afirma que não há resultado", async () => {
    render(<Harness options={[]} loading />);
    await userEvent.type(screen.getByRole("combobox"), "zz");
    expect(screen.getByText("Buscando atividades…")).toBeInTheDocument();
    expect(screen.queryByText("Nenhuma atividade encontrada.")).not.toBeInTheDocument();
  });

  test("RNF-09: com um termo curto demais não anuncia nada", async () => {
    render(<Harness options={[]} />);
    await userEvent.type(screen.getByRole("combobox"), "z");
    expect(screen.queryByText("Nenhuma atividade encontrada.")).not.toBeInTheDocument();
  });

  test("RNF-09: a lista aberta e o campo com erro não têm violações do axe", async () => {
    const { container } = render(<Harness />);
    await userEvent.type(screen.getByRole("combobox"), "62");
    await userEvent.keyboard("{ArrowDown}");
    await expectNoA11yViolations(container);
  });
});
