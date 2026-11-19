import { useOnlineStatus } from "../lib/useOnlineStatus.ts";
import { Callout } from "../ui/index.ts";

/** Aviso global quando o navegador perde a conexão; some sozinho ao voltar. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <Callout tone="warning" title="Você está sem conexão">
      Resultados já abertos continuam na tela, mas novas simulações precisam de internet.
    </Callout>
  );
}
