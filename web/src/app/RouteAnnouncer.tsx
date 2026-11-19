import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * Em uma SPA o leitor de tela não percebe a troca de página: ao navegar, anuncia o novo título e leva o
 * foco ao conteúdo principal (WCAG 2.4.3). Na primeira carga não mexe no foco.
 */
export function RouteAnnouncer({ mainId }: { mainId: string }) {
  const location = useLocation();
  const firstRender = useRef(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setMessage(`Página: ${document.title}`);
    document.getElementById(mainId)?.focus();
  }, [location.pathname, mainId]);

  return (
    <div role="status" aria-live="polite" className="visually-hidden">
      {message}
    </div>
  );
}
