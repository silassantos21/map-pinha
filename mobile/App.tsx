import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { Component, type ErrorInfo, type ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { fetchCurrentUser } from "./src/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "./src/lib/auth-storage";
import { reportCrash } from "./src/lib/crash-report";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MapScreen } from "./src/screens/MapScreen";

const queryClient = new QueryClient();

// Temporário (11/11/2026) — captura erro de render do React (que o
// ErrorUtils global não pega sempre) e manda pro backend, já que a build
// "preview" não mostra stack trace nenhum na tela. Remover depois de achar a
// causa do crash reportado nessa build.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportCrash("ErrorBoundary", error, { componentStack: info.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.center}>
          <Text style={{ color: "#fff" }}>Algo deu errado.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function AppInner() {
  const [token, setToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredToken();
        if (stored) {
          try {
            // Confirma que o token salvo ainda é válido antes de ir direto
            // pro mapa — evita cair numa tela quebrada com um token expirado.
            await fetchCurrentUser(stored);
            setToken(stored);
          } catch {
            await clearStoredToken();
          }
        }
      } catch (error) {
        reportCrash("App.checkSession", error);
      } finally {
        setIsCheckingSession(false);
      }
    })();
  }, []);

  const handleLoggedIn = async (newToken: string) => {
    await setStoredToken(newToken);
    setToken(newToken);
  };

  if (isCheckingSession) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <View style={styles.container}>
        {token ? <MapScreen token={token} /> : <LoginScreen onLoggedIn={handleLoggedIn} />}
        <StatusBar style="light" />
      </View>
    </QueryClientProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
});
