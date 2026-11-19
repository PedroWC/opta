import { forwardRef } from "react";

export interface SummaryItem {
  readonly field: string;
  readonly message: string;
  readonly label: string;
}

type Props = { items: readonly SummaryItem[]; onSelect: (field: string) => void };

/** Resumo de erros no topo do formulário: recebe o foco ao enviar e leva a cada campo (US-06, WCAG 3.3.1). */
export const ErrorSummary = forwardRef<HTMLDivElement, Props>(function ErrorSummary({ items, onSelect }, ref) {
  if (items.length === 0) return null;
  return (
    <div ref={ref} role="alert" tabIndex={-1} style={{ border: "2px solid var(--color-danger)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", marginBottom: "var(--space-6)" }}>
      <h2 style={{ color: "var(--color-danger)" }}>
        {items.length === 1 ? "1 campo precisa de ajuste" : `${items.length} campos precisam de ajuste`}
      </h2>
      <ul>
        {items.map((item) => (
          <li key={item.field}>
            <a
              href={`#campo-${item.field}`}
              onClick={(event) => {
                event.preventDefault();
                onSelect(item.field);
              }}
            >
              {item.label}: {item.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});
