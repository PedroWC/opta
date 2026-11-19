import { AppRoutes } from "../app/AppRoutes.tsx";
import { useServiceVersion } from "./hooks.ts";

/** Liga o rodapé à versão das premissas informada pela API (RF-11); sem resposta, mostra só o aviso. */
export function ConnectedRoutes() {
  const version = useServiceVersion();
  return <AppRoutes assumptionsVersion={version.data?.premissas_versao} />;
}
