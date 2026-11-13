import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addFavorite,
  createComment,
  deleteComment,
  deletePoi,
  fetchComments,
  fetchFavorites,
  fetchPoi,
  removeFavorite,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "PoiDetail">;

export function PoiDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<{ key: string; name: "PoiDetail"; params: RootStackParamList["PoiDetail"] }>();
  const { token, currentUser } = useAuth();
  const { poiId } = route.params;
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const poiQuery = useQuery({ queryKey: ["poi", poiId], queryFn: () => fetchPoi(token, poiId) });
  const favoritesQuery = useQuery({ queryKey: ["favorites"], queryFn: () => fetchFavorites(token) });
  const commentsQuery = useQuery({
    queryKey: ["comments", poiId],
    queryFn: () => fetchComments(token, poiId),
  });

  const isFavorited = favoritesQuery.data?.some((p) => p.id === poiId) ?? false;
  const isOwner = poiQuery.data?.user_id === currentUser.id;

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await removeFavorite(token, poiId);
      } else {
        await addFavorite(token, poiId);
      }
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    } catch (error) {
      Alert.alert("Erro", error instanceof Error ? error.message : "Tente de novo.");
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment(token, currentUser.id, poiId, newComment.trim());
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["comments", poiId] });
    } catch (error) {
      Alert.alert("Erro ao comentar", error instanceof Error ? error.message : "Tente de novo.");
    }
  };

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment(token, commentId);
      queryClient.invalidateQueries({ queryKey: ["comments", poiId] });
    } catch (error) {
      Alert.alert("Erro ao excluir", error instanceof Error ? error.message : "Tente de novo.");
    }
  };

  const handleDeletePoi = () => {
    Alert.alert("Excluir Marcador", "Tem certeza? Essa ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          await deletePoi(token, poiId);
          queryClient.invalidateQueries({ queryKey: ["pois"] });
          navigation.goBack();
        },
      },
    ]);
  };

  if (poiQuery.isLoading || !poiQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const poi = poiQuery.data;

  return (
    <FlatList
      style={styles.container}
      data={commentsQuery.data?.items ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          {poi.media[0] && <Image source={{ uri: poi.media[0].url }} style={styles.image} />}
          <Text style={styles.title}>{poi.name}</Text>
          {poi.owner_name && <Text style={styles.owner}>por {poi.owner_name}</Text>}
          {poi.description && <Text style={styles.description}>{poi.description}</Text>}
          {poi.address && <Text style={styles.address}>{poi.address}</Text>}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
              <Text style={styles.favoriteButtonText}>
                {isFavorited ? "★ Favoritado" : "☆ Favoritar"}
              </Text>
            </TouchableOpacity>
            {isOwner && (
              <>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate("PoiForm", { poiId: poi.id })}
                >
                  <Text style={styles.secondaryButtonText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePoi}>
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <Text style={styles.commentsTitle}>Comentários</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.comment}>
          <Text style={styles.commentAuthor}>{item.user_name ?? "Alguém"}</Text>
          <Text style={styles.commentBody}>{item.body}</Text>
          {(item.user_id === currentUser.id || isOwner) && (
            <TouchableOpacity onPress={() => removeComment(item.id)}>
              <Text style={styles.commentDelete}>Excluir</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      ListFooterComponent={
        <View style={styles.newCommentRow}>
          <TextInput
            style={styles.commentInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Escreva um comentário..."
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity style={styles.sendButton} onPress={submitComment}>
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  header: { padding: 16 },
  image: { width: "100%", height: 200, borderRadius: 8, marginBottom: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  owner: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  description: { color: "#d1d5db", fontSize: 14, marginTop: 8 },
  address: { color: "#9ca3af", fontSize: 13, marginTop: 4 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  favoriteButton: { backgroundColor: "#1f2937", borderRadius: 8, padding: 10, flex: 1 },
  favoriteButtonText: { color: "#facc15", textAlign: "center", fontWeight: "600" },
  secondaryButton: { backgroundColor: "#1f2937", borderRadius: 8, padding: 10, flex: 1 },
  secondaryButtonText: { color: "#d1d5db", textAlign: "center" },
  deleteButton: { backgroundColor: "#7f1d1d", borderRadius: 8, padding: 10, flex: 1 },
  deleteButtonText: { color: "#fff", textAlign: "center" },
  commentsTitle: { color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 24, marginBottom: 8 },
  comment: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
  },
  commentAuthor: { color: "#fff", fontWeight: "600", fontSize: 13 },
  commentBody: { color: "#d1d5db", fontSize: 14, marginTop: 2 },
  commentDelete: { color: "#f87171", fontSize: 12, marginTop: 4 },
  newCommentRow: { flexDirection: "row", gap: 8, padding: 16 },
  commentInput: {
    flex: 1,
    backgroundColor: "#1f2937",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  sendButton: { backgroundColor: "#3b82f6", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  sendButtonText: { color: "#fff", fontWeight: "600" },
});
