import path from "node:path";

import { expect, test } from "@playwright/test";

// Usa a sessão forjada pelo setup (ver e2e/global-setup.ts) — essas rotas
// exigem login.
test.use({
  // Coordenada perto do POI de teste ("estacao-do-industrial", Belo
  // Horizonte) — dá pro OSRM resolver uma rota curta e real em vez de uma
  // distância absurda que não testa nada de verdade.
  geolocation: { latitude: -19.955, longitude: -44.02 },
  permissions: ["geolocation"],
});

test("cria um POI com mídia", async ({ page }) => {
  const poiName = `E2E Test POI ${Date.now()}`;

  await page.goto("/");
  await page.getByRole("button", { name: "Criar novo POI" }).click();

  await page.locator("#poi-name").fill(poiName);
  await page.locator("#poi-category").selectOption({ index: 1 });

  await page.getByRole("button", { name: "Latitude/Longitude" }).click();
  await page.getByPlaceholder("Latitude").fill("-19.9550");
  await page.getByPlaceholder("Longitude").fill("-44.0200");
  await page.getByRole("button", { name: "Aplicar coordenadas" }).click();

  await page
    .locator('input[type="file"][accept="image/*"]')
    .setInputFiles(path.join(__dirname, "fixtures/test-image.png"));

  await page.getByRole("button", { name: "Salvar POI" }).click();

  await expect(page.getByText("POI criado")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(poiName)).toBeVisible();
});

test("calcula rota até um POI existente", async ({ page }) => {
  const response = await page.goto("/?poi=estacao-do-industrial");
  test.skip(response?.status() === 404, "POI de teste não existe neste banco — rode o seed local");

  // O deep-link voa até o POI e limpa o `?poi=` da URL quando termina — o
  // `flyTo` centraliza o mapa exatamente nas coordenadas do POI, então
  // clicar no centro do container acerta o marcador sem precisar localizar
  // o elemento certo em meio a vários (`.leaflet-marker-icon` sozinho não
  // diferencia o POI de interesse de qualquer outro marcador no DOM).
  await expect(page).toHaveURL("/", { timeout: 10_000 });
  await page.waitForTimeout(1500); // anda da animação do flyTo (1s) terminar

  const map = page.locator(".leaflet-container");
  const box = await map.boundingBox();
  if (!box) throw new Error("mapa não renderizou");
  await map.click({ position: { x: box.width / 2, y: box.height / 2 } });

  await page.getByRole("button", { name: "Como chegar" }).click();

  await expect(page.getByText(/\d+([.,]\d+)?\s*km/)).toBeVisible({ timeout: 15_000 });
});
