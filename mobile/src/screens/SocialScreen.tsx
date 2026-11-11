import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { fetchFollowers, fetchFollowing } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Tab = "followers" | "following";

export function SocialScreen() {
  const navigation = useNavigation<Nav>();
  const { token, currentUser } = useAuth();
  const [tab, setTab] = useState<Tab>("followers");

  const followersQuery = useQuery({
    queryKey: ["followers", currentUser.id],
    queryFn: () => fetchFollowers(token, currentUser.id),
  });
  const followingQuery = useQuery({
    queryKey: ["following", currentUser.id],
    queryFn: () => fetchFollowing(token, currentUser.id),
  });

  const activeQuery = tab === "followers" ? followersQuery : followingQuery;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("UserSearch")}>
          <Text style={styles.linkButtonText}>Buscar pessoas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate("Groups")}>
          <Text style={styles.linkButtonText}>Grupos</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "followers" && styles.tabActive]}
          onPress={() => setTab("followers")}
        >
          <Text style={styles.tabText}>Seguidores ({followersQuery.data?.total ?? 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "following" && styles.tabActive]}
          onPress={() => setTab("following")}
        >
          <Text style={styles.tabText}>Seguindo ({followingQuery.data?.total ?? 0})</Text>
        </TouchableOpacity>
      </View>

      {activeQuery.isLoading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={activeQuery.data?.items ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Nada por aqui ainda.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
            >
              <Text style={styles.name}>{item.name ?? "Sem nome"}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  topRow: { flexDirection: "row", gap: 8, padding: 16 },
  linkButton: { flex: 1, backgroundColor: "#1f2937", borderRadius: 8, padding: 12, alignItems: "center" },
  linkButtonText: { color: "#d1d5db", fontWeight: "600" },
  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#1f2937" },
  tabActive: { backgroundColor: "#3b82f6" },
  tabText: { color: "#fff", textAlign: "center", fontSize: 13 },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  name: { color: "#fff", fontSize: 16 },
});
