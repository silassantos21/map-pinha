import { useRoute } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { followUser, fetchUserPois, fetchUserProfile, unfollowUser } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";

export function UserProfileScreen() {
  const route = useRoute<{ key: string; name: "UserProfile"; params: RootStackParamList["UserProfile"] }>();
  const { token } = useAuth();
  const { userId } = route.params;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => fetchUserProfile(token, userId),
  });
  const poisQuery = useQuery({
    queryKey: ["user-pois", userId],
    queryFn: () => fetchUserPois(token, userId),
  });

  const toggleFollow = async () => {
    if (!profileQuery.data) return;
    if (profileQuery.data.is_following) {
      await unfollowUser(token, userId);
    } else {
      await followUser(token, userId);
    }
    queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
  };

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const profile = profileQuery.data;

  return (
    <FlatList
      style={styles.container}
      data={poisQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.name}>{profile.name ?? "Sem nome"}</Text>
          <Text style={styles.stats}>
            {profile.followers_count} seguidores · {profile.following_count} seguindo ·{" "}
            {profile.total_pois} Marcadores
          </Text>
          {profile.is_following !== null && (
            <TouchableOpacity style={styles.followButton} onPress={toggleFollow}>
              <Text style={styles.followButtonText}>
                {profile.is_following ? "Deixar de seguir" : "Seguir"}
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.poisTitle}>Marcadores</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhum Marcador visível.</Text>}
      renderItem={({ item }) => (
        <View style={styles.poiRow}>
          <Text style={styles.poiName}>{item.name}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  header: { padding: 16 },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  stats: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
  followButton: { backgroundColor: "#3b82f6", borderRadius: 8, padding: 10, marginTop: 12, alignItems: "center" },
  followButtonText: { color: "#fff", fontWeight: "600" },
  poisTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 20 },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 16 },
  poiRow: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
  poiName: { color: "#fff" },
});
