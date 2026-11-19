import { z } from "zod";
import { parsePercentInput } from "../../lib/percent.ts";
import type { SimulationRequest } from "../../api/types.ts";
import { UF_CODES } from "./ufs.ts";

export const REGIME_OPTIONS = [
  { value: "SIMPLES", label: "Simples Nacional" },
  { value: "SIMPLES_HIBRIDO", label: "Simples híbrido" },
  { value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
] as const;

const integerPercent = (message: string) =>
  z.string().refine((value) => /^\d{1,3}$/.test(value) && Number(value) <= 100, message);

/** Regras de validação do formulário (RN-09), com mensagens em PT-BR ligadas a cada campo. */
export const simulatorSchema = z.object({
  cnae: z.string().regex(/^\d{4}-\d\/\d{2}$/, "Informe um CNAE válido, por exemplo 6201-5/01."),
  uf: z.string().refine((value) => UF_CODES.includes(value), "Escolha o estado."),
  issRate: z.string().refine((value) => parsePercentInput(value) !== null, "Informe um percentual entre 0 e 100."),
  revenue: z.string().regex(/^\d+\.\d{2}$/, "Informe a receita bruta anual (use 0 se não houver)."),
  payroll: z.string().regex(/^\d+\.\d{2}$/, "Informe a folha anual (use 0 se não houver)."),
  b2b: integerPercent("Use um número inteiro de 0 a 100."),
  purchases: integerPercent("Use um número inteiro de 0 a 100."),
  regimes: z.array(z.enum(["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"])).min(1, "Escolha ao menos um regime para comparar."),
});

export type SimulatorValues = z.infer<typeof simulatorSchema>;

export const EMPTY_VALUES: SimulatorValues = {
  cnae: "",
  uf: "",
  issRate: "",
  revenue: "",
  payroll: "",
  b2b: "",
  purchases: "",
  regimes: ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"],
};

/** Exemplo da US-01: serviços de TI, R$ 1,8 mi de receita, folha de R$ 540 mil e 70% B2B. */
export const EXAMPLE_VALUES: SimulatorValues = {
  cnae: "6201-5/01",
  uf: "SP",
  issRate: "5,00",
  revenue: "1800000.00",
  payroll: "540000.00",
  b2b: "70",
  purchases: "25",
  regimes: ["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"],
};

/** Ordem dos campos na tela, usada para ordenar o resumo de erros. */
export const FIELD_ORDER: ReadonlyArray<keyof SimulatorValues> = ["cnae", "uf", "issRate", "revenue", "payroll", "b2b", "purchases", "regimes"];

/** Converte valores já validados no corpo do contrato (dinheiro e alíquotas como texto decimal). */
export function toRequest(values: SimulatorValues): SimulationRequest {
  return {
    cnae: values.cnae,
    uf: values.uf,
    receita_bruta_anual: values.revenue,
    folha_anual: values.payroll,
    perfil_clientes: { b2b_pct: Number(values.b2b) },
    compras_creditaveis_pct: Number(values.purchases),
    aliquota_icms_iss: parsePercentInput(values.issRate) ?? "5.0000",
    regimes: [...values.regimes],
  };
}

const POINTER_TO_FIELD: Readonly<Record<string, keyof SimulatorValues>> = {
  "/cnae": "cnae",
  "/uf": "uf",
  "/aliquota_icms_iss": "issRate",
  "/receita_bruta_anual": "revenue",
  "/folha_anual": "payroll",
  "/perfil_clientes/b2b_pct": "b2b",
  "/compras_creditaveis_pct": "purchases",
  "/regimes": "regimes",
};

/** Liga o ponteiro JSON de um erro 422 da API ao campo do formulário (ou null se não houver campo). */
export function fieldOfPointer(pointer: string): keyof SimulatorValues | null {
  return POINTER_TO_FIELD[pointer] ?? (pointer.startsWith("/regimes/") ? "regimes" : null);
}
