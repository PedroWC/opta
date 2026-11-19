import type { ReactNode } from "react";
import styles from "./Disclosure.module.css";

type Props = {
  summary: string;
  defaultOpen?: boolean;
  /** Abertura controlada (ex.: impressão); sem valor, o item abre e fecha por conta própria. */
  open?: boolean | undefined;
  /** Avisa quando abre ou fecha (permite montar o conteúdo só quando aberto). */
  onToggle?: (open: boolean) => void;
  children: ReactNode;
};

/** Mostrar/ocultar nativo (`details`): teclado e leitor de tela sem JavaScript. */
export function Disclosure({ summary, defaultOpen = false, open, onToggle, children }: Props) {
  return (
    <details className={styles["disclosure"]} open={open ?? defaultOpen} onToggle={(event) => onToggle?.(event.currentTarget.open)}>
      <summary className={styles["summary"]}>{summary}</summary>
      <div className={styles["content"]}>{children}</div>
    </details>
  );
}
