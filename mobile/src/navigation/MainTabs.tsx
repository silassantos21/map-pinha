import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Bell, Heart, Map, Users } from "lucide-react-native";

import { FavoritesScreen } from "../screens/FavoritesScreen";
import { MapScreen } from "../screens/MapScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { SocialScreen } from "../screens/SocialScreen";
import { useAuth } from "../lib/auth-context";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { token } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#111827" },
        headerTintColor: "#fff",
        tabBarStyle: { backgroundColor: "#111827", borderTopColor: "#1f2937" },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
      }}
    >
      <Tab.Screen
        name="MapTab"
        options={{ title: "Mapa", tabBarIcon: ({ color, size }) => <Map color={color} size={size} /> }}
      >
        {() => <MapScreen token={token} />}
      </Tab.Screen>
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ title: "Favoritos", tabBarIcon: ({ color, size }) => <Heart color={color} size={size} /> }}
      />
      <Tab.Screen
        name="SocialTab"
        component={SocialScreen}
        options={{ title: "Social", tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{ title: "Notificações", tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }}
      />
    </Tab.Navigator>
  );
}
