import { TextField, type TextFieldProps } from "./TextField.tsx";

type Props = Omit<TextFieldProps, "value" | "onChange" | "type" | "suffix" | "min" | "max" | "step"> & {
  /** Inteiro de 0 a 100 em texto, ou vazio. */
  value: string;
  onValueChange: (value: string) => void;
};

/** Percentual inteiro de 0 a 100 (RN-09). A validação final é do formulário; aqui só o teclado e a máscara. */
export function PercentField({ value, onValueChange, ...rest }: Props) {
  return (
    <TextField
      {...rest}
      type="number"
      inputMode="numeric"
      min={0}
      max={100}
      step={1}
      suffix="%"
      value={value}
      onChange={(event) => onValueChange(event.target.value)}
    />
  );
}
