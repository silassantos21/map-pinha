import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Button, Linking, StyleSheet, Text, View } from "react-native";

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
  // Evita processar o id_token duas vezes: o `promptAsync()` abaixo e o
  // listener de deep link (handleIncomingUrl) são dois caminhos
  // independentes que podem, em teoria, resolver o mesmo login.
  const handledRef = useRef(false);

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

  const completeLogin = async (idToken: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    setIsSigningIn(true);
    try {
      const { access_token } = await mobileGoogleLogin(idToken);
      await onLoggedIn(access_token);
    } catch (error) {
      console.error(error);
      handledRef.current = false;
      Alert.alert(
        "Não foi possível entrar",
        error instanceof Error ? error.message : "Tente de novo em instantes.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  // No Android, o Custom Tab aberto pelo `promptAsync()` só fecha sozinho
  // quando o retorno bate com um esquema registrado do próprio app — como o
  // Google não aceita mais `mapinha://` como redirect URI (só https), o
  // retorno de verdade vem da página-ponte (`mobile-auth-redirect.html`),
  // que repassa pro app via deep link manualmente. Esse listener é quem
  // conclui o login nesse caminho — o `promptAsync()` abaixo normalmente só
  // abre o navegador e nunca resolve sozinho nesse fluxo.
  useEffect(() => {
    function handleIncomingUrl(url: string) {
      const idToken = new URL(url).searchParams.get("id_token");
      if (idToken) {
        completeLogin(idToken);
      }
    }

    const subscription = Linking.addEventListener("url", ({ url }) => handleIncomingUrl(url));
    Linking.getInitialURL().then((url) => {
      if (url) handleIncomingUrl(url);
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await promptAsync();
      if (result.type === "success" && result.params.id_token) {
        await completeLogin(result.params.id_token);
      }
      // Qualquer outro resultado (cancel/dismiss/sem id_token): o listener
      // de deep link acima é quem deve concluir o login, se o Google de
      // fato autenticou — não é necessariamente um erro aqui.
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
