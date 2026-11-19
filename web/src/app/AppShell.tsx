import { NavLink, Outlet } from "react-router-dom";
import { SkipLink } from "../ui/index.ts";
import { LegalNotice } from "./LegalNotice.tsx";
import { OfflineBanner } from "./OfflineBanner.tsx";
import { RouteAnnouncer } from "./RouteAnnouncer.tsx";
import styles from "./AppShell.module.css";

const MAIN_ID = "conteudo";

const NAVIGATION = [
  { to: "/", label: "Simulador", end: true },
  { to: "/premissas", label: "Premissas", end: false },
  { to: "/sobre", label: "Metodologia", end: false },
] as const;

type Props = { assumptionsVersion?: string | undefined };

/** Estrutura comum: pular link, cabeçalho com navegação, conteúdo principal, rodapé com aviso legal. */
export function AppShell({ assumptionsVersion }: Props) {
  return (
    <div className={styles["shell"]}>
      <SkipLink href={`#${MAIN_ID}`}>Pular para o conteúdo</SkipLink>
      <header className={styles["header"]}>
        <p className={styles["brand"]}>Opta</p>
        <nav aria-label="Principal">
          <ul className={styles["nav"]}>
            {NAVIGATION.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={styles["link"] ?? ""}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id={MAIN_ID} tabIndex={-1} className={styles["main"]}>
        <OfflineBanner />
        <Outlet />
      </main>
      <footer className={styles["footer"]}>
        <LegalNotice assumptionsVersion={assumptionsVersion} />
        <p>
          <NavLink to="/sobre">Metodologia e fontes legais</NavLink> ·{" "}
          <a href="https://github.com/PedroWC/opta">Código no GitHub</a>
        </p>
      </footer>
      <RouteAnnouncer mainId={MAIN_ID} />
    </div>
  );
}
