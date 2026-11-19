import { defineConfig, devices } from "@playwright/test";

const API_PORT = 3100;
const WEB_PORT = 5173;
/** `E2E_PROD=1`: testa o build estático servido pela própria API, pela mesma origem e com a CSP ativa (DEC-15). */
const PRODUCTION = process.env["E2E_PROD"] === "1";

const developmentServers = [
  {
    command: "npm start",
    cwd: "..",
    env: { PORT: String(API_PORT) },
    url: `http://localhost:${API_PORT}/v1/health`,
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
  {
    command: "npm run dev",
    env: { OPTA_API_URL: `http://localhost:${API_PORT}` },
    url: `http://localhost:${WEB_PORT}`,
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
];

const productionServers = [
  {
    // Constrói o front e sobe só a API, que serve `web/dist` sob a mesma origem.
    command: "npm run build && cd .. && npm start",
    env: { PORT: String(API_PORT), OPTA_WEB_DIR: "web/dist" },
    url: `http://localhost:${API_PORT}/v1/health`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
];

// Os testes rodam contra a API real (repositório em memória) e a interface, em desktop e celular.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PRODUCTION ? API_PORT : WEB_PORT}`, locale: "pt-BR", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "celular", use: { ...devices["Pixel 5"] } },
  ],
  webServer: PRODUCTION ? productionServers : developmentServers,
});
