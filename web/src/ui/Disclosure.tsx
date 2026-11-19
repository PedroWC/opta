import type { ReactNode } from "react";
import styles from "./Disclosure.module.css";

type Props = { summary: string; defaultOpen?: boolean; children: ReactNode };

/** Mostrar/ocultar nativo (`details`): teclado e leitor de tela sem JavaScript. */
export function Disclosure({ summary, defaultOpen = false, children }: Props) {
  return (
    <details className={styles["disclosure"]} open={defaultOpen}>
      <summary className={styles["summary"]}>{summary}</summary>
      <div className={styles["content"]}>{children}</div>
    </details>
  );
}
