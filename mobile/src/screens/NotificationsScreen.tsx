import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";
import type { AppNotification } from "../types/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Mesmo texto por tipo da web (`notification-bell.tsx`), portado aqui.
function formatText(notification: AppNotification): string {
  const actor = notification.actor_name ?? "Alguém";
  switch (notification.type) {
    case "new_follower":
      return `${actor} começou a seguir você`;
    case "poi_reaction":
      return `${actor} reagiu ${notification.payload.emoji ?? ""} ao seu Marcador "${notification.payload.poi_name ?? ""}"`;
    case "new_poi_from_followed":
      return `${actor} criou um novo Marcador: "${notification.payload.poi_name ?? ""}"`;
    case "group_invite":
      return `${actor} te convidou pro grupo "${notification.group_name ?? ""}"`;
    case "group_invite_accepted":
      return `${actor} aceitou seu convite pro grupo "${notification.group_name ?? ""}"`;
    case "poi_comment":
      return `${actor} comentou no seu Marcador "${notification.payload.poi_name ?? ""}": ${notification.payload.body_preview ?? ""}`;
    default:
      return actor;
  }
}

export function NotificationsScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  // Mesmo intervalo de polling da web (30s) — sem WebSocket, decisão já
  // tomada na Fase 7 (ver SPRINTS.md).
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(token),
    refetchInterval: 30_000,
  });

  const handlePress = async (notification: AppNotification) => {
    if (!notification.read_at) {
      await markNotificationRead(token, notification.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
    if (notification.poi_id) {
      navigation.navigate("PoiDetail", { poiId: notification.poi_id });
    } else if (notification.group_id) {
      navigation.navigate("GroupDetail", { groupId: notification.group_id });
    } else if (notification.type === "new_follower") {
      navigation.navigate("UserProfile", { userId: notification.actor_id });
    }
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead(token);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={data?.items ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        (data?.unread_count ?? 0) > 0 ? (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Marcar todas como lidas</Text>
          </TouchableOpacity>
        ) : undefined
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma notificação ainda.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.row, !item.read_at && styles.rowUnread]}
          onPress={() => handlePress(item)}
        >
          <Text style={styles.text}>{formatText(item)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  markAllButton: { padding: 12, alignItems: "center" },
  markAllText: { color: "#3b82f6", fontWeight: "600" },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  rowUnread: { backgroundColor: "#1e293b" },
  text: { color: "#fff", fontSize: 14 },
});
