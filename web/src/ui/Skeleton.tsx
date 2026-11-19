type Props = { label?: string; lines?: number };

/** Esqueleto de carregamento: a região fica `aria-busy` e o texto de status é lido uma vez. */
export function Skeleton({ label = "Carregando…", lines = 3 }: Props) {
  return (
    <div aria-busy="true" role="status">
      <span className="visually-hidden">{label}</span>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} aria-hidden="true" style={{ height: "1rem", margin: "0.5rem 0", background: "var(--color-surface)", borderRadius: "var(--radius-sm)" }} />
      ))}
    </div>
  );
}
