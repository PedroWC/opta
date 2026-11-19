import type { SimulationRequest } from "../../api/types.ts";
import { simulatorSchema, toRequest, fromRequest, type SimulatorValues } from "../simulator/schema.ts";

/** Versão do formato do fragmento: permite evoluir o formato sem quebrar links antigos. */
const PREFIX = "v1.";
/** Limite do tamanho aceito, para não decodificar lixo gigante vindo de um link. */
const MAX_FRAGMENT_LENGTH = 2000;

export type DecodeResult =
  | { readonly status: "empty" }
  | { readonly status: "valid"; readonly request: SimulationRequest }
  | { readonly status: "invalid"; readonly values: Partial<SimulatorValues> };

const FIELDS = Object.keys(simulatorSchema.shape) as ReadonlyArray<keyof SimulatorValues>;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encoded.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

/** Entrada da simulação -> texto para o fragmento da URL (sem `#`). Os dados ficam só no navegador (RNF-12). */
export function encodeRequest(request: SimulationRequest): string {
  return `${PREFIX}${toBase64Url(JSON.stringify(request))}`;
}

/** Extrai, de um objeto qualquer, os campos do formulário que têm o tipo certo; o resto é descartado. */
function candidateValues(source: Record<string, unknown>): Partial<SimulatorValues> {
  const perfil = (source["perfil_clientes"] ?? {}) as Record<string, unknown>;
  const text = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
  const integerText = (value: unknown): string | undefined => (typeof value === "number" && Number.isInteger(value) ? String(value) : undefined);
  const candidate: Partial<SimulatorValues> = {};
  const set = <K extends keyof SimulatorValues>(key: K, value: SimulatorValues[K] | undefined): void => {
    if (value !== undefined) candidate[key] = value;
  };
  set("cnae", text(source["cnae"]));
  set("uf", text(source["uf"]));
  const rate = text(source["aliquota_icms_iss"]);
  set("issRate", rate === undefined ? undefined : rate.replace(/\.(\d\d)\d\d$/, ",$1"));
  set("revenue", text(source["receita_bruta_anual"]));
  set("payroll", text(source["folha_anual"]));
  set("b2b", integerText(perfil["b2b_pct"]));
  set("purchases", integerText(source["compras_creditaveis_pct"]));
  const regimes = source["regimes"];
  set(
    "regimes",
    Array.isArray(regimes) ? (regimes.filter((item): item is SimulatorValues["regimes"][number] => item === "SIMPLES" || item === "SIMPLES_HIBRIDO" || item === "LUCRO_PRESUMIDO")) : ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"],
  );
  return candidate;
}

/**
 * Fragmento da URL (com ou sem `#`) -> entrada. Nunca confia no conteúdo: valida cada campo com o mesmo esquema do
 * formulário (RN-09). Se algum campo não passar, devolve só os válidos para preencher o formulário.
 */
export function decodeFragment(hash: string): DecodeResult {
  const fragment = hash.replace(/^#/, "");
  if (fragment === "") return { status: "empty" };
  if (fragment.length > MAX_FRAGMENT_LENGTH || !fragment.startsWith(PREFIX)) return { status: "invalid", values: {} };

  let source: unknown;
  try {
    source = JSON.parse(fromBase64Url(fragment.slice(PREFIX.length)));
  } catch {
    return { status: "invalid", values: {} };
  }
  if (typeof source !== "object" || source === null || Array.isArray(source)) return { status: "invalid", values: {} };

  const candidate = candidateValues(source as Record<string, unknown>);
  const whole = simulatorSchema.safeParse(candidate);
  if (whole.success) return { status: "valid", request: toRequest(whole.data) };

  const valid: Partial<SimulatorValues> = {};
  for (const field of FIELDS) {
    const value = candidate[field];
    if (value !== undefined && simulatorSchema.shape[field].safeParse(value).success) Object.assign(valid, { [field]: value });
  }
  return { status: "invalid", values: valid };
}

/** Valores para preencher o formulário a partir do resultado da decodificação. */
export function valuesOf(result: DecodeResult): Partial<SimulatorValues> {
  if (result.status === "valid") return fromRequest(result.request);
  return result.status === "invalid" ? result.values : {};
}
