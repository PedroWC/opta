import { NetworkError, ProblemDetailsError, UnexpectedResponseError } from "../../api/errors.ts";
import type { FieldProblem } from "../../api/types.ts";

export interface ErrorDescription {
  readonly title: string;
  readonly message: string;
  /** Repetir a chamada pode resolver (rede, servidor). */
  readonly retryable: boolean;
  /** Erros por campo (422 de validação), para listar e levar o usuário de volta ao formulário. */
  readonly fields: readonly FieldProblem[];
  /** Código e status para o suporte, sem jargão para o usuário (RNF-07). */
  readonly technical: string | null;
}

const FIELD_LABELS: Readonly<Record<string, string>> = {
  "/cnae": "Atividade (CNAE)",
  "/uf": "UF",
  "/aliquota_icms_iss": "Alíquota de ISS ou ICMS",
  "/receita_bruta_anual": "Receita bruta anual",
  "/folha_anual": "Folha de pagamento anual",
  "/perfil_clientes/b2b_pct": "Clientes empresas (B2B)",
  "/compras_creditaveis_pct": "Compras que geram crédito",
  "/regimes": "Regimes",
};

/** Rótulo em português do campo apontado por um erro da API. */
export function fieldLabel(pointer: string): string {
  return FIELD_LABELS[pointer] ?? "Dados informados";
}

const SERVER_MESSAGE = "Seus dados foram mantidos. Tente de novo em instantes.";

/** Traduz qualquer erro da camada de API em texto para a pessoa, sem vazar detalhes técnicos. */
export function describeError(error: unknown): ErrorDescription {
  if (error instanceof NetworkError) {
    return { title: "Sem conexão com o servidor", message: "Verifique sua internet e tente de novo. Seus dados foram mantidos.", retryable: true, fields: [], technical: null };
  }
  if (error instanceof ProblemDetailsError) {
    const technical = `Código ${error.code} · HTTP ${error.status}`;
    if (error.status === 501) {
      return { title: "Este regime ainda não está disponível nesta versão", message: "Os demais regimes continuam disponíveis.", retryable: false, fields: [], technical };
    }
    if (error.status === 404) {
      return { title: "Não encontramos o que você procurou", message: "Confira o dado informado e tente de novo.", retryable: false, fields: [], technical };
    }
    if (error.code === "SIM-001") {
      return { title: "Os dados não foram aceitos", message: "Corrija os campos abaixo e simule de novo.", retryable: false, fields: error.fields, technical };
    }
    if (error.code === "SIM-002") {
      return { title: "Faltam premissas para algum ano", message: error.message, retryable: false, fields: [], technical };
    }
    if (error.code === "SIM-003") {
      return { title: "Receita acima do limite do Simples Nacional", message: error.message, retryable: false, fields: [], technical };
    }
    if (error.code === "SIM-004") {
      return { title: "Atividade fora do escopo desta versão", message: error.message, retryable: false, fields: [], technical };
    }
    if (error.isClientError) {
      return { title: "O pedido não foi aceito", message: "Revise os dados e tente de novo.", retryable: false, fields: error.fields, technical };
    }
    return { title: "Não conseguimos calcular agora", message: SERVER_MESSAGE, retryable: true, fields: [], technical };
  }
  if (error instanceof UnexpectedResponseError) {
    return { title: "Não conseguimos calcular agora", message: SERVER_MESSAGE, retryable: true, fields: [], technical: null };
  }
  return { title: "Algo deu errado", message: SERVER_MESSAGE, retryable: true, fields: [], technical: null };
}
