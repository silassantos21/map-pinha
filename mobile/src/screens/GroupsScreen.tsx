import { useNavigation } from "@react-navigation/native";
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

import { acceptGroupInvite, createGroup, fetchGroupInvites, fetchGroups, leaveOrRemoveFromGroup } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function GroupsScreen() {
  const navigation = useNavigation<Nav>();
  const { token, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");

  const groupsQuery = useQuery({ queryKey: ["groups"], queryFn: () => fetchGroups(token) });
  const invitesQuery = useQuery({ queryKey: ["group-invites"], queryFn: () => fetchGroupInvites(token) });

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    try {
      await createGroup(token, currentUser.id, newGroupName.trim());
      setNewGroupName("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Tente de novo.");
    }
  };

  const handleAccept = async (groupId: string) => {
    await acceptGroupInvite(token, groupId, currentUser.id);
    queryClient.invalidateQueries({ queryKey: ["group-invites"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const handleDecline = async (groupId: string) => {
    await leaveOrRemoveFromGroup(token, groupId, currentUser.id);
    queryClient.invalidateQueries({ queryKey: ["group-invites"] });
  };

  return (
    <View style={styles.container}>
      <View style={styles.createRow}>
        <TextInput
          style={styles.input}
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="Nome do novo grupo"
          placeholderTextColor="#6b7280"
        />
        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Criar</Text>
        </TouchableOpacity>
      </View>

      {(invitesQuery.data?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Convites pendentes</Text>
          {invitesQuery.data!.map((invite) => (
            <View key={invite.group_id} style={styles.inviteRow}>
              <Text style={styles.inviteText}>
                {invite.group_name} — convidado por {invite.invited_by_name ?? "alguém"}
              </Text>
              <View style={styles.inviteActions}>
                <TouchableOpacity onPress={() => handleAccept(invite.group_id)}>
                  <Text style={styles.acceptText}>Aceitar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDecline(invite.group_id)}>
                  <Text style={styles.declineText}>Recusar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {groupsQuery.isLoading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={groupsQuery.data ?? []}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.empty}>Você não tem grupos ainda.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate("GroupDetail", { groupId: item.id })}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.member_count} membros</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  createRow: { flexDirection: "row", gap: 8, padding: 16 },
  input: { flex: 1, backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, paddingHorizontal: 12 },
  createButton: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  createButtonText: { color: "#fff", fontWeight: "600" },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: "#9ca3af", fontSize: 13, marginBottom: 6 },
  inviteRow: { backgroundColor: "#1f2937", borderRadius: 8, padding: 10, marginBottom: 6 },
  inviteText: { color: "#fff", fontSize: 13 },
  inviteActions: { flexDirection: "row", gap: 16, marginTop: 6 },
  acceptText: { color: "#4ade80", fontWeight: "600" },
  declineText: { color: "#f87171", fontWeight: "600" },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  meta: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
});
