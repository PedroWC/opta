import type { ReactNode } from "react";
import { cx } from "../lib/ids.ts";
import styles from "./Callout.module.css";

type Tone = "info" | "warning" | "error" | "success";

const ICON: Record<Tone, string> = { info: "ℹ", warning: "⚠", error: "✖", success: "✔" };
const LABEL: Record<Tone, string> = { info: "Informação", warning: "Atenção", error: "Erro", success: "Sucesso" };

type Props = { tone?: Tone; title?: string; children: ReactNode };

/** Aviso com ícone e texto (nunca só cor). Erros usam role="alert"; os demais, role="status" ou nenhum. */
export function Callout({ tone = "info", title, children }: Props) {
  return (
    <div className={cx(styles["callout"], styles[tone])} role={tone === "error" ? "alert" : tone === "info" ? undefined : "status"}>
      <span className={styles["icon"]} aria-hidden="true">{ICON[tone]}</span>
      <div>
        <p className={styles["title"]}>
          <span className="visually-hidden">{LABEL[tone]}: </span>
          {title}
        </p>
        <div>{children}</div>
      </div>
    </div>
  );
}
