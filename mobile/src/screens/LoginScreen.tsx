import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Button, StyleSheet, Text, View } from "react-native";

import { mobileGoogleLogin } from "../lib/api";

// Login via navegador (expo-auth-session), não SDK nativo — trocamos depois
// de confirmar que @react-native-google-signin/google-signin falha de forma
// intermitente em builds Expo com a New Architecture (issues #1350, #1330,
// #1362 do próprio pacote, sem correção publicada). expo-web-browser e
// expo-auth-session são mantidos pela própria Expo e não têm esse histórico.
WebBrowser.maybeCompleteAuthSession();

// O Google não aceita mais um esquema customizado (`mapinha://`) como
// redirect URI, nem pro client tipo "Web" — por isso o redirect aqui aponta
// pra uma página "ponte" https já publicada no site (ver
// frontend/public/mobile-auth-redirect.html), que repassa o retorno de
// volta pro app via `mapinha://`. Esse mesmo valor precisa estar cadastrado
// em "Authorized redirect URIs" do client Web no Google Cloud Console.
const REDIRECT_URI = "https://mapinha-iota.vercel.app/mobile-auth-redirect.html";

interface LoginScreenProps {
  onLoggedIn: (token: string) => void | Promise<void>;
}

export function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Nonce exigido pelo Google no fluxo de id_token (OpenID Connect) — gerado
  // uma vez por montagem da tela, não precisa ser validado no backend hoje
  // (o backend já valida `aud` e `email_verified` via tokeninfo do Google).
  const nonce = useMemo(() => Crypto.randomUUID(), []);
  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  const [request, , promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "",
      redirectUri: REDIRECT_URI,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      usePKCE: false,
      extraParams: { nonce },
    },
    discovery,
  );

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await promptAsync();
      if (result.type !== "success") {
        // Usuário cancelou o fluxo — não é erro.
        return;
      }

      const idToken = result.params.id_token;
      if (!idToken) throw new Error("O Google não devolveu um idToken.");

      const { access_token } = await mobileGoogleLogin(idToken);
      await onLoggedIn(access_token);
    } catch (error) {
      console.error(error);
      Alert.alert(
        "Não foi possível entrar",
        error instanceof Error ? error.message : "Tente de novo em instantes.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MaPinha</Text>
      {isSigningIn ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <Button title="Entrar com Google" onPress={handleSignIn} disabled={!request} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    backgroundColor: "#111827",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
});
