import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { fetchCurrentUser } from "./src/lib/api";
import { clearStoredToken, getStoredToken, setStoredToken } from "./src/lib/auth-storage";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MapScreen } from "./src/screens/MapScreen";

const queryClient = new QueryClient();

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
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
      setIsCheckingSession(false);
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
  },
});
