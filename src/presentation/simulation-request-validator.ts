import { z } from "zod";
import { InvalidInputError } from "../domain/errors/invalid-input-error.ts";
import { CompanyProfile } from "../domain/shared/company-profile.ts";
import { Money } from "../domain/shared/money.ts";
import { TaxRate } from "../domain/shared/tax-rate.ts";
import { ValidationFailedError, type FieldError } from "./validation-failed-error.ts";

export interface ValidSimulationRequest {
  readonly company: CompanyProfile;
  readonly regimes: readonly string[] | undefined;
}

/** Valida o corpo de POST /v1/simulacoes contra o contrato e o converte em objetos de domínio (RN-09). */
export class SimulationRequestValidator {
  private static readonly MONEY = z
    .string({ invalid_type_error: "Informe o valor como texto decimal com duas casas, ex.: \"1800000.00\"." })
    .regex(/^-?\d+\.\d{2}$/, "Use texto decimal com duas casas, ex.: \"1800000.00\".")
    .refine((value) => !value.startsWith("-"), "O valor não pode ser negativo.");

  private static readonly PERCENT_INTEGER = z
    .number({ invalid_type_error: "Informe um número inteiro de 0 a 100." })
    .int("Informe um número inteiro de 0 a 100.")
    .min(0, "Informe um número inteiro de 0 a 100.")
    .max(100, "Informe um número inteiro de 0 a 100.");

  private static readonly SCHEMA = z
    .object({
      cnae: z.string().regex(/^\d{4}-\d\/\d{2}$/, "Use o formato 0000-0/00."),
      uf: z.string().regex(/^[A-Z]{2}$/, "Use a sigla da UF em maiúsculas, ex.: SP."),
      receita_bruta_anual: SimulationRequestValidator.MONEY,
      folha_anual: SimulationRequestValidator.MONEY,
      perfil_clientes: z
        .object({ b2b_pct: SimulationRequestValidator.PERCENT_INTEGER })
        .strict(),
      compras_creditaveis_pct: SimulationRequestValidator.PERCENT_INTEGER,
      aliquota_icms_iss: z
        .string()
        .regex(/^\d+\.\d{4}$/, "Use percentual com quatro casas, ex.: \"5.0000\".")
        .optional(),
      regimes: z.array(z.enum(["SIMPLES", "SIMPLES_HIBRIDO", "LUCRO_PRESUMIDO"])).min(1).optional(),
    })
    .strict();

  validate(body: unknown): ValidSimulationRequest {
    const parsed = SimulationRequestValidator.SCHEMA.safeParse(body);
    if (!parsed.success) throw new ValidationFailedError(this.toFieldErrors(parsed.error));
    const data = parsed.data;
    try {
      const company = new CompanyProfile({
        cnae: data.cnae,
        state: data.uf,
        annualGrossRevenue: Money.fromText(data.receita_bruta_anual),
        annualPayroll: Money.fromText(data.folha_anual),
        b2bPercentage: data.perfil_clientes.b2b_pct,
        creditablePurchasesPercentage: data.compras_creditaveis_pct,
        ...(data.aliquota_icms_iss ? { icmsIssRate: TaxRate.fromPercentage(data.aliquota_icms_iss) } : {}),
      });
      return { company, regimes: data.regimes };
    } catch (error) {
      if (error instanceof InvalidInputError) throw new ValidationFailedError([{ pointer: "", detail: error.message }]);
      throw error;
    }
  }

  private toFieldErrors(error: z.ZodError): FieldError[] {
    return error.issues.flatMap((issue): FieldError[] => {
      const base = issue.path.map((segment) => `/${String(segment)}`).join("");
      if (issue.code === "unrecognized_keys") {
        return issue.keys.map((key) => ({ pointer: `${base}/${key}`, detail: "Campo desconhecido." }));
      }
      if (issue.code === "invalid_type" && issue.received === "undefined") {
        return [{ pointer: base, detail: "Campo obrigatório." }];
      }
      return [{ pointer: base, detail: issue.message }];
    });
  }
}
