import { z } from "zod";
import { ValidationFailedError, type FieldError } from "./validation-failed-error.ts";

export interface AssumptionsQuery {
  readonly year: number | undefined;
}

export type ActivityQuery =
  | { readonly kind: "cnae"; readonly cnae: string }
  | { readonly kind: "search"; readonly term: string; readonly page: number; readonly pageSize: number };

/** Valida os parâmetros de consulta (query string) das rotas de leitura, com erro por parâmetro. */
export class QueryValidator {
  private static readonly ASSUMPTIONS = z.object({
    ano: z
      .string()
      .regex(/^\d{4}$/, "Informe o ano com quatro dígitos, de 2026 a 2033.")
      .transform(Number)
      .refine((year) => year >= 2026 && year <= 2033, "O ano deve estar entre 2026 e 2033.")
      .optional(),
  });

  private static readonly ACTIVITY = z.object({
    cnae: z.string().regex(/^\d{4}-\d\/\d{2}$/, "Use o formato 0000-0/00.").optional(),
    q: z.string().trim().min(2, "Informe ao menos 2 caracteres.").max(80, "No máximo 80 caracteres.").optional(),
    pagina: z.string().regex(/^[1-9]\d*$/, "A página começa em 1.").transform(Number).optional(),
    tamanho: z
      .string()
      .regex(/^\d+$/, "Informe um inteiro de 1 a 20.")
      .transform(Number)
      .refine((size) => size >= 1 && size <= 20, "Informe um inteiro de 1 a 20.")
      .optional(),
  });

  assumptions(query: Record<string, string>): AssumptionsQuery {
    const parsed = QueryValidator.ASSUMPTIONS.safeParse(query);
    if (!parsed.success) throw new ValidationFailedError(this.toFieldErrors(parsed.error));
    return { year: parsed.data.ano };
  }

  activity(query: Record<string, string>): ActivityQuery {
    const parsed = QueryValidator.ACTIVITY.safeParse(query);
    if (!parsed.success) throw new ValidationFailedError(this.toFieldErrors(parsed.error));
    const { cnae, q, pagina, tamanho } = parsed.data;
    if ((cnae === undefined) === (q === undefined)) {
      throw new ValidationFailedError([{ pointer: "/cnae", detail: "Informe cnae ou q (apenas um dos dois)." }]);
    }
    if (cnae !== undefined) return { kind: "cnae", cnae };
    return { kind: "search", term: q ?? "", page: pagina ?? 1, pageSize: tamanho ?? 10 };
  }

  private toFieldErrors(error: z.ZodError): FieldError[] {
    return error.issues.map((issue) => ({ pointer: `/${issue.path.join("/")}`, detail: issue.message }));
  }
}
