import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Em uma SPA o leitor de tela não percebe a troca de página: ao navegar, anuncia o novo título e leva o
 * foco ao conteúdo principal (WCAG 2.4.3). Só age quando o caminho muda de verdade: comparar com o caminho
 * anterior (e não usar um sinalizador de "primeira renderização") resiste ao StrictMode, que executa os efeitos duas vezes.
 */
export function RouteAnnouncer({ mainId }: { mainId: string }) {
  const location = useLocation();
  const previousPath = useRef(location.pathname);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (previousPath.current === location.pathname) return;
    previousPath.current = location.pathname;
    setMessage(`Página: ${document.title}`);
    document.getElementById(mainId)?.focus();
  }, [location.pathname, mainId]);

  return (
    <div role="status" aria-live="polite" className="visually-hidden">
      {message}
    </div>
  );
}
