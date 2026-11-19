import type { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { describedBy, useFieldIds } from "./Field.tsx";
import styles from "./TextField.module.css";

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> & {
  ref?: Ref<HTMLSelectElement>;
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
};

/** Seleção nativa (UF): teclado e leitor de tela de graça. */
export function Select({ label, hint, error, options, placeholder, ...rest }: Props) {
  const ids = useFieldIds();
  return (
    <div className={styles["field"]}>
      <label htmlFor={ids.input} className={styles["label"]}>{label}</label>
      {hint ? <p id={ids.hint} className={styles["hint"]}>{hint}</p> : null}
      {error ? (
        <p id={ids.error} className={styles["error"]}>
          <span aria-hidden="true">⚠ </span>
          <span className="visually-hidden">Erro:</span> {error}
        </p>
      ) : null}
      <div className={styles["control"]}>
        <select
          {...rest}
          id={ids.input}
          className={styles["input"]}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error)}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
