const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Temporário (11/11/2026) — só pra diagnosticar o crash da build "preview"
// sem precisar de adb/logcat no aparelho do dono do projeto. Remover depois
// de achar a causa (ver backend/app/api/v1/debug.py).
export function reportCrash(label: string, error: unknown, extra?: Record<string, unknown>) {
  const payload = {
    label,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    extra,
    timestamp: new Date().toISOString(),
  };
  fetch(`${API_URL}/api/v1/debug/mobile-crash`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Best-effort — se nem isso funcionar, não tem mais nada a fazer aqui.
  });
}
