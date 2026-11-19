import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "../lib/ids.ts";
import { describedBy, useFieldIds } from "./Field.tsx";
import styles from "./TextField.module.css";

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> & {
  label: string;
  hint?: ReactNode;
  /** Mensagem de erro; quando presente, o campo fica inválido e o texto é lido junto do rótulo. */
  error?: ReactNode;
  prefix?: string;
  suffix?: string;
};

export function TextField({ label, hint, error, prefix, suffix, className, ...rest }: TextFieldProps) {
  const ids = useFieldIds();
  return (
    <div className={cx(styles["field"], className)}>
      <label htmlFor={ids.input} className={styles["label"]}>
        {label}
      </label>
      {hint ? (
        <p id={ids.hint} className={styles["hint"]}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={ids.error} className={styles["error"]}>
          <span aria-hidden="true">⚠ </span>
          <span className="visually-hidden">Erro:</span> {error}
        </p>
      ) : null}
      <div className={cx(styles["control"], error ? styles["invalid"] : false)}>
        {prefix ? <span className={styles["affix"]} aria-hidden="true">{prefix}</span> : null}
        <input
          {...rest}
          id={ids.input}
          className={styles["input"]}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(ids, hint, error)}
        />
        {suffix ? <span className={styles["affix"]} aria-hidden="true">{suffix}</span> : null}
      </div>
    </div>
  );
}
