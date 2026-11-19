import type { Regime } from "../../api/types.ts";
import { regimeStyle } from "./regimes.ts";

/** Nome do regime com marcador e cor; o texto está sempre presente. */
export function RegimeBadge({ regime }: { regime: Regime }) {
  const style = regimeStyle(regime);
  return (
    <span style={{ color: style.colorVar, fontWeight: "var(--font-weight-semibold)" }}>
      <span aria-hidden="true">{style.marker} </span>
      {style.label}
    </span>
  );
}
