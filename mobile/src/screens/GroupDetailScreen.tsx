import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  deleteGroup,
  fetchGroupDetail,
  fetchGroupPois,
  inviteToGroup,
  leaveOrRemoveFromGroup,
  searchUsers,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";
import type { UserPublic } from "../types/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "GroupDetail">;

export function GroupDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<{ key: string; name: "GroupDetail"; params: RootStackParamList["GroupDetail"] }>();
  const { token, currentUser } = useAuth();
  const { groupId } = route.params;
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);

  const detailQuery = useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: () => fetchGroupDetail(token, groupId),
  });
  const poisQuery = useQuery({
    queryKey: ["group-pois", groupId],
    queryFn: () => fetchGroupPois(token, groupId),
  });

  const isOwner = detailQuery.data?.owner_id === currentUser.id;

  const runSearch = async (text: string) => {
    setQuery(text);
    setResults(text.trim() ? await searchUsers(token, text.trim()) : []);
  };

  const invite = async (userId: string) => {
    try {
      await inviteToGroup(token, currentUser.id, groupId, userId);
      Alert.alert("Convite enviado");
      setQuery("");
      setResults([]);
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Tente de novo.");
    }
  };

  const handleLeaveOrDelete = () => {
    Alert.alert(isOwner ? "Excluir grupo" : "Sair do grupo", "Tem certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: isOwner ? "Excluir" : "Sair",
        style: "destructive",
        onPress: async () => {
          if (isOwner) {
            await deleteGroup(token, groupId);
          } else {
            await leaveOrRemoveFromGroup(token, groupId, currentUser.id);
          }
          queryClient.invalidateQueries({ queryKey: ["groups"] });
          navigation.goBack();
        },
      },
    ]);
  };

  if (detailQuery.isLoading || !detailQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const group = detailQuery.data;
  const memberIds = new Set(group.members.map((m) => m.user_id));

  return (
    <FlatList
      style={styles.container}
      data={poisQuery.data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>{group.name}</Text>

          <Text style={styles.sectionTitle}>Membros ({group.members.length})</Text>
          {group.members.map((member) => (
            <Text key={member.user_id} style={styles.member}>
              {member.name ?? "Sem nome"} {member.status === "pending" ? "(convite pendente)" : ""}
            </Text>
          ))}

          {isOwner && (
            <>
              <Text style={styles.sectionTitle}>Convidar</Text>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={runSearch}
                placeholder="Buscar por nome..."
                placeholderTextColor="#6b7280"
              />
              {results.map((user) => (
                <View key={user.id} style={styles.searchRow}>
                  <Text style={styles.member}>{user.name ?? "Sem nome"}</Text>
                  {memberIds.has(user.id) ? (
                    <Text style={styles.alreadyMember}>Já é membro</Text>
                  ) : (
                    <TouchableOpacity onPress={() => invite(user.id)}>
                      <Text style={styles.inviteText}>Convidar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}

          <TouchableOpacity style={styles.dangerButton} onPress={handleLeaveOrDelete}>
            <Text style={styles.dangerButtonText}>{isOwner ? "Excluir grupo" : "Sair do grupo"}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Marcadores desse grupo</Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhum Marcador ainda.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.poiRow}
          onPress={() => navigation.navigate("PoiDetail", { poiId: item.id })}
        >
          <Text style={styles.member}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  header: { padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  sectionTitle: { color: "#9ca3af", fontSize: 13, marginTop: 16, marginBottom: 6 },
  member: { color: "#fff", fontSize: 14, marginBottom: 4 },
  input: { backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, padding: 10 },
  searchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  alreadyMember: { color: "#6b7280", fontSize: 12 },
  inviteText: { color: "#3b82f6", fontWeight: "600" },
  dangerButton: { backgroundColor: "#7f1d1d", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 20 },
  dangerButtonText: { color: "#fff", fontWeight: "600" },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 8 },
  poiRow: { paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1f2937" },
});
