/** Corpo ausente, JSON malformado ou tipo de conteúdo não suportado (400, SIM-006). */
export class MalformedRequestError extends Error {
  readonly code = "SIM-006";

  constructor(detail: string) {
    super(detail);
    this.name = new.target.name;
  }
}
