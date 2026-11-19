import { defineConfig, devices } from "@playwright/test";

const API_PORT = 3100;
const WEB_PORT = 5173;

// Os testes rodam contra a API real (repositório em memória) e a interface em modo de desenvolvimento, com o proxy /v1.
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${WEB_PORT}`, locale: "pt-BR", trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    { name: "celular", use: { ...devices["Pixel 5"] } },
  ],
  webServer: [
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
  ],
});
