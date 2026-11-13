import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { fetchFavorites } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { requestGeofencePermissions } from "../lib/geofence";
import type { RootStackParamList } from "../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function FavoritesScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["favorites"], queryFn: () => fetchFavorites(token) });
  const [requestingPermission, setRequestingPermission] = useState(false);

  const handleEnableProximityAlerts = async () => {
    setRequestingPermission(true);
    try {
      const granted = await requestGeofencePermissions();
      Alert.alert(
        granted ? "Avisos de proximidade ativados" : "Permissão não concedida",
        granted
          ? "Você vai receber um aviso ao chegar perto de um Marcador favoritado ou seu."
          : "Sem a permissão de localização em segundo plano, não é possível avisar quando você chega perto de um Marcador.",
      );
    } finally {
      setRequestingPermission(false);
    }
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
      data={data ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <TouchableOpacity
          style={styles.enableButton}
          onPress={handleEnableProximityAlerts}
          disabled={requestingPermission}
        >
          <Text style={styles.enableButtonText}>
            {requestingPermission ? "Pedindo permissão..." : "Ativar avisos de proximidade"}
          </Text>
        </TouchableOpacity>
      }
      ListEmptyComponent={<Text style={styles.empty}>Nenhum favorito ainda.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          onPress={() => navigation.navigate("PoiDetail", { poiId: item.id })}
        >
          <Text style={styles.name}>{item.name}</Text>
          {item.owner_name && <Text style={styles.owner}>por {item.owner_name}</Text>}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  enableButton: { backgroundColor: "#1f2937", margin: 16, borderRadius: 8, padding: 12, alignItems: "center" },
  enableButtonText: { color: "#3b82f6", fontWeight: "600" },
  empty: { color: "#9ca3af", textAlign: "center", marginTop: 40 },
  row: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1f2937" },
  name: { color: "#fff", fontSize: 16, fontWeight: "600" },
  owner: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
});
