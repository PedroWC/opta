import { useId } from "react";
import type { ReactNode } from "react";

export interface FieldIds {
  readonly input: string;
  readonly hint: string;
  readonly error: string;
}

/** Ids estáveis para ligar rótulo, dica e erro ao controle (aria-describedby). */
export function useFieldIds(): FieldIds {
  const base = useId();
  return { input: `${base}-input`, hint: `${base}-hint`, error: `${base}-error` };
}

export function describedBy(ids: FieldIds, hint?: ReactNode, error?: ReactNode): string | undefined {
  const parts = [hint ? ids.hint : null, error ? ids.error : null].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}
