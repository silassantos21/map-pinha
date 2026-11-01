import { test as setup } from "@playwright/test";
import { encode } from "next-auth/jwt";

// Testes autenticados (criar POI, calcular rota) precisam de uma sessão
// logada, mas o único provider configurado é Google OAuth — automatizar o
// consentimento real do Google é lento, frágil e exigiria uma conta de
// teste dedicada. Em vez disso, forjamos uma sessão válida do Auth.js v5
// direto: cria/sincroniza um usuário de teste no backend (mesmo endpoint
// que o callback `jwt` real chama no login) e assina um JWT idêntico ao que
// o Auth.js geraria, usando a mesma função (`encode`) e os mesmos
// parâmetros (`salt` = nome do cookie de sessão — ver
// `node_modules/@auth/core/lib/actions/callback/index.js`). Não contorna
// nenhum código de produção: só imita exatamente o resultado de um login
// real, puramente do lado dos testes.
const STORAGE_STATE_PATH = "e2e/.auth/user.json";
// "example.com" (RFC 2606) em vez de ".local"/".test" — o validador de
// e-mail do backend (`email-validator`) rejeita TLDs de uso especial como
// essas como "reserved name", mas aceita domínios de documentação padrão.
const TEST_USER = {
  email: "e2e-test@example.com",
  name: "E2E Test User",
  avatar_url: null,
  google_id: "e2e-test-google-id",
};

setup("autentica usuário de teste", async ({ page, context }) => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const internalSecret = process.env.INTERNAL_API_SECRET;
  const authSecret = process.env.NEXTAUTH_SECRET;
  if (!internalSecret || !authSecret) {
    throw new Error(
      "INTERNAL_API_SECRET/NEXTAUTH_SECRET ausentes — rode os testes com `.env.local` carregado (ver playwright.config.ts).",
    );
  }

  const syncRes = await page.request.post(`${apiUrl}/api/v1/auth/sync`, {
    headers: { "X-Internal-Secret": internalSecret },
    data: TEST_USER,
  });
  if (!syncRes.ok()) {
    throw new Error(`Falha ao sincronizar usuário de teste: HTTP ${syncRes.status()}`);
  }
  const { id: userId } = (await syncRes.json()) as { id: string };

  const sessionToken = await encode({
    token: { sub: userId, userId, email: TEST_USER.email, name: TEST_USER.name },
    secret: authSecret,
    salt: "authjs.session-token",
  });

  await context.addCookies([
    {
      name: "authjs.session-token",
      value: sessionToken,
      url: "http://localhost:3000",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);

  // Usuário "novo" pro Auth.js = onboarding de primeiro login abriria
  // sozinho (ver onboarding-dialog.tsx) e bloquearia o resto dos testes
  // atrás do overlay do modal. Marca como já visto antes de salvar o
  // storage state, igual qualquer usuário que já passou pelo tutorial uma
  // vez de verdade faria.
  await page.goto("http://localhost:3000/");
  await page.evaluate((id) => {
    localStorage.setItem(`mapinha-onboarding-seen:${id}`, "1");
  }, userId);

  await context.storageState({ path: STORAGE_STATE_PATH });
});
