import styles from "./AppShell.module.css";

type Props = { assumptionsVersion?: string | undefined };

/** Aviso de simulador educacional, presente em todas as telas (RF-11). */
export function LegalNotice({ assumptionsVersion }: Props) {
  return (
    <p className={styles["legal"]}>
      Simulador educacional. Não substitui o seu contador nem é consultoria tributária.
      {assumptionsVersion ? ` Premissas v${assumptionsVersion}.` : null}
    </p>
  );
}
