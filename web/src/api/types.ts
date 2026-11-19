import type { components } from "./schema.ts";

/** Tipos do contrato OpenAPI (gerados em schema.ts a partir de docs/api/openapi.yaml). */
type Schemas = components["schemas"];

export type SimulationRequest = Schemas["SimulacaoRequest"];
export type SimulationResponse = Schemas["SimulacaoResponse"];
export type AssumptionsResponse = Schemas["PremissasResponse"];
export type Activity = Schemas["Atividade"];
export type ActivityPage = Schemas["AtividadesPagina"];
export type ServiceVersion = Schemas["Versao"];
export type ProblemBody = Schemas["Problem"];
export type FieldProblem = Schemas["CampoInvalido"];
export type Regime = Schemas["Regime"];
