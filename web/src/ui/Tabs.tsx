import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import styles from "./Tabs.module.css";

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly panel: ReactNode;
}

type Props = { label: string; tabs: readonly TabItem[]; initialId?: string };

/** Abas no padrão APG: tablist, roving tabindex, setas, Home e End; ativação automática. */
export function Tabs({ label, tabs, initialId }: Props) {
  const base = useId();
  const [activeId, setActiveId] = useState(initialId ?? tabs[0]?.id ?? "");
  const refs = useRef(new Map<string, HTMLButtonElement>());

  const move = (event: KeyboardEvent, index: number): void => {
    const last = tabs.length - 1;
    const next =
      event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const target = tabs[next];
    if (!target) return;
    setActiveId(target.id);
    refs.current.get(target.id)?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={label} className={styles["list"]}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={(element) => {
              if (element) refs.current.set(tab.id, element);
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${tab.id}`}
            aria-selected={tab.id === activeId}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={tab.id === activeId ? 0 : -1}
            className={styles["tab"]}
            onClick={() => setActiveId(tab.id)}
            onKeyDown={(event) => move(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={tab.id !== activeId}
          tabIndex={0}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
