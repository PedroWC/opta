/** Junta nomes de classe ignorando valores vazios (CSS Modules). */
export function cx(...names: Array<string | false | null | undefined>): string {
  return names.filter(Boolean).join(" ");
}
