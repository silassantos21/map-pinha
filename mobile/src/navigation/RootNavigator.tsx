import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import { fetchCurrentUser } from "../lib/api";
import { AuthContext } from "../lib/auth-context";
import { clearStoredToken, getStoredToken, setStoredToken } from "../lib/auth-storage";
import { GeofenceSync } from "../lib/GeofenceSync";
import { GroupDetailScreen } from "../screens/GroupDetailScreen";
import { GroupsScreen } from "../screens/GroupsScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { PoiDetailScreen } from "../screens/PoiDetailScreen";
import { PoiFormScreen } from "../screens/PoiFormScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
import { UserSearchScreen } from "../screens/UserSearchScreen";
import type { CurrentUser } from "../types/api";
import { MainTabs } from "./MainTabs";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: "#111827" },
  headerTintColor: "#fff",
  contentStyle: { backgroundColor: "#111827" },
};

export function RootNavigator() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getStoredToken();
      if (stored) {
        try {
          // Confirma que o token salvo ainda é válido antes de ir direto
          // pro mapa — evita cair numa tela quebrada com um token expirado.
          const user = await fetchCurrentUser(stored);
          setToken(stored);
          setCurrentUser(user);
        } catch {
          await clearStoredToken();
        }
      }
      setIsCheckingSession(false);
    })();
  }, []);

  const handleLoggedIn = async (newToken: string) => {
    await setStoredToken(newToken);
    const user = await fetchCurrentUser(newToken);
    setToken(newToken);
    setCurrentUser(user);
  };

  const logout = () => {
    clearStoredToken();
    setToken(null);
    setCurrentUser(null);
  };

  if (isCheckingSession) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const isLoggedIn = token !== null && currentUser !== null;

  return (
    <NavigationContainer>
      <AuthContext.Provider value={token !== null && currentUser !== null ? { token, currentUser, logout } : null}>
        {isLoggedIn && <GeofenceSync />}
        <Stack.Navigator screenOptions={screenOptions}>
          {!isLoggedIn ? (
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {() => <LoginScreen onLoggedIn={handleLoggedIn} />}
            </Stack.Screen>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
              <Stack.Screen
                name="PoiForm"
                component={PoiFormScreen}
                options={{ title: "Ponto de interesse" }}
              />
              <Stack.Screen name="PoiDetail" component={PoiDetailScreen} options={{ title: "Detalhe" }} />
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{ title: "Perfil" }}
              />
              <Stack.Screen
                name="UserSearch"
                component={UserSearchScreen}
                options={{ title: "Buscar pessoas" }}
              />
              <Stack.Screen name="Groups" component={GroupsScreen} options={{ title: "Grupos" }} />
              <Stack.Screen
                name="GroupDetail"
                component={GroupDetailScreen}
                options={{ title: "Grupo" }}
              />
            </>
          )}
        </Stack.Navigator>
      </AuthContext.Provider>
    </NavigationContainer>
  );
}
