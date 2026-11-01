import { defineConfig, devices } from "@playwright/test";

// `process.loadEnvFile` é nativo do Node 20.6+ — evita adicionar `dotenv`
// como dependência só pra isso. O Playwright roda via Node puro (não passa
// pelo carregamento de env do Next), então precisa disso pra enxergar
// `.env.local` (NEXTAUTH_SECRET, INTERNAL_API_SECRET etc, usados no setup
// de autenticação do `e2e/global-setup.ts`).
try {
  process.loadEnvFile(".env.local");
} catch {
  // arquivo pode não existir em CI, onde as envs vêm do ambiente mesmo
}

export default defineConfig({
  testDir: "./e2e",
  // Serial, não paralelo: os testes rodam contra um único `next dev` local
  // (não um servidor de produção escalável) — com vários workers batendo
  // nele ao mesmo tempo, o servidor fica lento o bastante pra estourar
  // timeouts que são folgados o suficiente em execução serial (confirmado
  // rodando a suíte várias vezes: falhas intermitentes só apareciam com
  // workers > 1, nunca rodando um de cada vez).
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global-setup\.ts/,
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
      dependencies: ["setup"],
    },
  ],
  // Assume o dev server já rodando (`npm run dev`) — mais rápido pra rodar
  // os testes repetidamente durante o desenvolvimento. `reuseExistingServer`
  // evita dar conflito de porta se já tiver um no ar.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
