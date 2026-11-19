import { BrowserRouter } from "react-router-dom";
import { ApiProvider } from "./api/ApiProvider.tsx";
import { OptaApiClient } from "./api/client.ts";
import { ConnectedRoutes } from "./api/ConnectedRoutes.tsx";

// Mesma origem em produção; em desenvolvimento o proxy /v1 do Vite faz o mesmo papel (DEC-15).
const client = new OptaApiClient();

export function App() {
  return (
    <ApiProvider client={client}>
      <BrowserRouter>
        <ConnectedRoutes />
      </BrowserRouter>
    </ApiProvider>
  );
}
