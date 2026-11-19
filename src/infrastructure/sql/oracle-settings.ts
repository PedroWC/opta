import { InvalidInputError } from "../../domain/errors/invalid-input-error.ts";

/** Configuração do Oracle lida só de variáveis de ambiente: nenhum segredo é versionado (ADR-0005). */
export class OracleSettings {
  private constructor(
    readonly user: string,
    readonly password: string,
    readonly connectString: string,
  ) {}

  static fromEnvironment(env: Readonly<Record<string, string | undefined>>): OracleSettings {
    const user = env["OPTA_ORACLE_USER"];
    const password = env["OPTA_ORACLE_PASSWORD"];
    const connectString = env["OPTA_ORACLE_CONNECT_STRING"];
    if (!user || !password || !connectString) {
      throw new InvalidInputError(
        "Defina OPTA_ORACLE_USER, OPTA_ORACLE_PASSWORD e OPTA_ORACLE_CONNECT_STRING para usar o Oracle.",
      );
    }
    return new OracleSettings(user, password, connectString);
  }
}
