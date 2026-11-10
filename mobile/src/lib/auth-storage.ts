import * as SecureStore from "expo-secure-store";

// Chave única no armazenamento criptografado do dispositivo — só guarda o
// JWT próprio do app (`backend/app/core/security.py`, Fase 10 Parte 1), sem
// refresh token nesta versão (expira em 30 dias, login de novo com o Google).
const TOKEN_KEY = "mapinha_access_token";

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
