import type { ReactNode } from "react";
import styles from "./Table.module.css";

type Props = { caption: string; children: ReactNode };

/** Tabela com legenda e rolagem contida e focável (WCAG 2.1.1 e 1.4.10). Use `th scope` nos cabeçalhos. */
export function Table({ caption, children }: Props) {
  return (
    <div className={styles["scroll"]} role="region" aria-label={caption} tabIndex={0}>
      <table className={styles["table"]}>
        <caption className={styles["caption"]}>{caption}</caption>
        {children}
      </table>
    </div>
  );
}
