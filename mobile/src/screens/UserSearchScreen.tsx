import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { followUser, searchUsers, unfollowUser } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";
import type { UserPublic } from "../types/api";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function UserSearchScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserPublic[]>([]);
  const [searching, setSearching] = useState(false);

  const runSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      setResults(await searchUsers(token, text.trim()));
    } finally {
      setSearching(false);
    }
  };

  const toggleFollow = async (user: UserPublic) => {
    if (user.is_following) {
      await unfollowUser(token, user.id);
    } else {
      await followUser(token, user.id);
    }
    setResults((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, is_following: !u.is_following } : u)),
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={query}
        onChangeText={runSearch}
        placeholder="Buscar por nome..."
        placeholderTextColor="#6b7280"
        autoFocus
      />
      {searching && <ActivityIndicator style={{ marginTop: 16 }} color="#fff" />}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.nameButton}
              onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
            >
              <Text style={styles.name}>{item.name ?? "Sem nome"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.followButton} onPress={() => toggleFollow(item)}>
              <Text style={styles.followButtonText}>{item.is_following ? "Seguindo" : "Seguir"}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827", padding: 16 },
  input: { backgroundColor: "#1f2937", color: "#fff", borderRadius: 8, padding: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1f2937",
  },
  nameButton: { flex: 1 },
  name: { color: "#fff", fontSize: 16 },
  followButton: { backgroundColor: "#3b82f6", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  followButtonText: { color: "#fff", fontSize: 12, fontWeight: "600" },
});
