import { useState } from "react";
import { Button } from "../../ui/index.ts";

/** Copia a URL atual (que carrega a simulação no fragmento) e avisa, em região `status`, o que foi copiado (US-07). */
export function CopyLinkButton() {
  const [message, setMessage] = useState("");
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Link copiado. Ele contém os números que você digitou.");
    } catch {
      setMessage("Não foi possível copiar automaticamente. Copie o endereço na barra do navegador.");
    }
  };
  return (
    <>
      <Button variant="secondary" onClick={() => void copy()}>
        Copiar link
      </Button>
      <p role="status" className="visually-hidden">{message}</p>
      {message ? <p aria-hidden="true">{message}</p> : null}
      <p>O link contém os números que você digitou; compartilhe com cuidado.</p>
    </>
  );
}
