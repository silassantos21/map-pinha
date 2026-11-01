import { expect, test } from "@playwright/test";

// Fluxo "compartilhar link" (Sprint 6) — a parte de visualizar o link
// compartilhado não exige login (é público por design), então roda sem
// depender do setup de autenticação. Usa o POI "estacao-do-industrial",
// seedado localmente nesta máquina (ver SPRINTS.md) — se não existir no
// banco de quem rodar isso, o teste pula em vez de falhar.
test.describe("página pública de POI (/p/[slug])", () => {
  test("mostra nome, categoria e CTAs de um POI público", async ({ page }) => {
    const response = await page.goto("/p/estacao-do-industrial");
    test.skip(response?.status() === 404, "POI de teste não existe neste banco — rode o seed local");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Estação do industrial", {
      ignoreCase: true,
    });
    await expect(page.getByRole("link", { name: /ver no mapa completo/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /abrir no google maps/i })).toBeVisible();
  });

  test("404 pra slug inexistente", async ({ page }) => {
    const response = await page.goto("/p/slug-que-nunca-vai-existir-xyz123");
    expect(response?.status()).toBe(404);
  });

  test("link 'ver no mapa completo' leva de volta pro mapa e voa até o POI", async ({ page }) => {
    const response = await page.goto("/p/estacao-do-industrial");
    test.skip(response?.status() === 404, "POI de teste não existe neste banco — rode o seed local");

    await page.getByRole("link", { name: /ver no mapa completo/i }).click();
    await expect(page).toHaveURL(/\/\?poi=estacao-do-industrial/);
    // Depois de resolver o deep-link, a página limpa o `?poi=` da URL (ver map-view.tsx).
    await expect(page).toHaveURL("/", { timeout: 10_000 });
  });
});
