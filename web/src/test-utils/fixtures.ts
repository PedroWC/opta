import type { Activity, ActivityPage, AssumptionsResponse, ServiceVersion, SimulationRequest, SimulationResponse } from "../api/types.ts";

/** Fixtures tipadas pelo contrato: se o contrato mudar, o TypeScript e o teste de conformidade acusam. */
export const requestFixture: SimulationRequest = {
  cnae: "8630-5/04",
  uf: "SP",
  receita_bruta_anual: "300000.00",
  folha_anual: "0.00",
  perfil_clientes: { b2b_pct: 50 },
  compras_creditaveis_pct: 40,
  aliquota_icms_iss: "5.0000",
};

const line = (codigo: string, valor: string, fonte: string) => ({
  codigo,
  base: "300000.00",
  aliquota: "8.0800",
  valor,
  fonte,
});

export const simulationFixture: SimulationResponse = {
  premissas_versao: "2026.1",
  anos: Array.from({ length: 8 }, (_, index) => ({
    ano: 2026 + index,
    regimes: [
      { regime: "SIMPLES", carga_total: "24240.00", aliquota_efetiva: "8.0800", tributos: [line("DAS", "24240.00", "LC 123/2006, Anexo III, 2ª faixa")] },
      { regime: "SIMPLES_HIBRIDO", carga_total: "36114.96", aliquota_efetiva: "12.0383", tributos: [line("DAS", "20094.96", "LC 123/2006, Anexo III, 2ª faixa")] },
      { regime: "LUCRO_PRESUMIDO", carga_total: "54060.00", aliquota_efetiva: "18.0200", tributos: [line("IRPJ", "14400.00", "Lei 9.249/1995")] },
    ],
    melhor_regime: "SIMPLES",
  })),
  recomendacao: {
    regime: "SIMPLES",
    motivo: "Menor carga acumulada em 2026–2033 contra SIMPLES_HIBRIDO; o que mais pesou: tributos sobre o consumo.",
    economia_acumulada: "130431.12",
    fator_decisivo: { codigo: "TRIBUTOS_SOBRE_CONSUMO", diferenca: "130431.12" },
    segundo_colocado: "SIMPLES_HIBRIDO",
  },
  regimes_indisponiveis: [],
  avisos: ["Simulador educacional: não é consultoria tributária."],
};

export const assumptionsFixture: AssumptionsResponse = {
  premissas_versao: "2026.1",
  anos: [
    { ano: 2026, cbs: "0.9000", ibs: "0.1000", icms_iss_vigente_pct: 100, pis_cofins_extinto: false, ano_de_teste: true },
    { ano: 2027, cbs: "8.8000", ibs: "0.1000", icms_iss_vigente_pct: 100, pis_cofins_extinto: true, ano_de_teste: false },
  ],
};

export const activityFixture: Activity = {
  cnae: "6201-5/01",
  descricao: "Desenvolvimento de programas de computador sob encomenda",
  natureza: "SERVICO",
  anexo_simples: "V",
  usa_fator_r: true,
  presuncao_irpj: "32.0000",
  presuncao_csll: "32.0000",
};

export const activityPageFixture: ActivityPage = { itens: [activityFixture], pagina: 1, tem_proxima: false };

export const versionFixture: ServiceVersion = { versao: "0.0.0", premissas_versao: "2026.1" };
