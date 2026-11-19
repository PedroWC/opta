import { useState } from "react";
import { formatMoneyText, parseMoneyInput } from "../lib/money.ts";
import { TextField, type TextFieldProps } from "./TextField.tsx";

type Props = Omit<TextFieldProps, "value" | "onChange" | "defaultValue" | "prefix" | "inputMode" | "type"> & {
  /** Texto decimal do contrato ("1800000.00") ou vazio. */
  value: string;
  onValueChange: (decimal: string) => void;
};

/** Campo em reais: aceita pt-BR ao digitar e colar, e entrega texto decimal (nunca number). */
export function MoneyField({ value, onValueChange, onBlur, error, ...rest }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value === "" ? "" : formatMoneyText(value));
  const unreadable = draft !== null && draft.trim() !== "" && parseMoneyInput(draft) === null;
  return (
    <TextField
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      prefix="R$"
      value={shown}
      error={error ?? (unreadable ? "Digite um valor em reais, por exemplo 1.800.000,00." : undefined)}
      onChange={(event) => {
        setDraft(event.target.value);
        const parsed = parseMoneyInput(event.target.value);
        if (parsed !== null || event.target.value.trim() === "") onValueChange(parsed ?? "");
      }}
      onBlur={(event) => {
        setDraft(null);
        onBlur?.(event);
      }}
    />
  );
}
