import type { ButtonHTMLAttributes } from "react";
import { cx } from "../lib/ids.ts";
import styles from "./Button.module.css";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  /** Enquanto carrega, o botão fica inerte mas continua focável e anunciado (aria-disabled). */
  loading?: boolean;
};

export function Button({ variant = "primary", loading = false, className, onClick, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      className={cx(styles["button"], styles[variant], className)}
      aria-disabled={loading || rest.disabled ? true : undefined}
      aria-busy={loading || undefined}
      onClick={(event) => {
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {children}
      {loading ? <span className="visually-hidden"> Carregando…</span> : null}
    </button>
  );
}
