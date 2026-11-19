import { Link } from "react-router-dom";
import { usePageTitle } from "../app/usePageTitle.ts";

export function NotFoundPage() {
  usePageTitle("Página não encontrada");
  return (
    <>
      <h1>Página não encontrada</h1>
      <p>O endereço não existe. <Link to="/">Voltar ao simulador</Link>.</p>
    </>
  );
}
