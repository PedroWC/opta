import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { UiShowcase } from "./ui/UiShowcase.tsx";
import "./styles/index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Elemento #root não encontrado.");

createRoot(container).render(
  <StrictMode>
    {import.meta.env.DEV && window.location.hash === "#/ui" ? <UiShowcase /> : <App />}
  </StrictMode>,
);
