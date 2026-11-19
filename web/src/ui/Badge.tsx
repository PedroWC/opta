import type { ReactNode } from "react";
import { cx } from "../lib/ids.ts";
import styles from "./Badge.module.css";

type Props = { tone?: "neutral" | "highlight"; children: ReactNode };

/** Selo sempre com texto (nunca só cor), ex.: "Menor carga" ou a versão das premissas. */
export function Badge({ tone = "neutral", children }: Props) {
  return <span className={cx(styles["badge"], styles[tone])}>{children}</span>;
}
