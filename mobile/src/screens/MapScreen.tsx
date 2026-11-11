import { useQuery } from "@tanstack/react-query";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { CARTOON_MAX_ZOOM, CARTOON_TILE_URL } from "../constants/map-theme";
import { resolveIconName } from "../constants/poi-icons";
import { fetchCategories, fetchPois } from "../lib/api";

interface MapScreenProps {
  token: string;
}

// Centro aproximado do Brasil — só o ponto de partida antes do usuário
// mexer no mapa; sem geolocalização nem "seguir minha posição" nesta
// primeira versão (fica pra quando a Parte 5 — geofence — chegar).
const INITIAL_REGION = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 20,
  longitudeDelta: 20,
};

export function MapScreen({ token }: MapScreenProps) {
  const { data: pois, isLoading: isLoadingPois } = useQuery({
    queryKey: ["pois", token],
    queryFn: () => fetchPois(token),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]));

  return (
    <View style={styles.container}>
      {/* mapType="none": sem isso, o MapView sempre mostra o mapa padrão do
      Google por baixo de qualquer UrlTile — a Stadia não "substitui" nada
      sozinha, só sobrepõe. */}
      <MapView style={StyleSheet.absoluteFill} initialRegion={INITIAL_REGION} mapType="none">
        <UrlTile urlTemplate={CARTOON_TILE_URL} maximumZ={CARTOON_MAX_ZOOM} flipY={false} />
        {pois?.map((poi) => {
          const category = categoryById.get(poi.category_id);
          const Icon = resolveIconName(poi.icon_name ?? category?.icon_name);
          const color = category?.color_hex ?? "#6b7280";
          return (
            <Marker
              key={poi.id}
              coordinate={{ latitude: poi.lat, longitude: poi.lng }}
              title={poi.name}
              description={poi.owner_name ? `por ${poi.owner_name}` : undefined}
            >
              <View style={[styles.marker, { borderColor: color }]}>
                <Icon size={16} color={color} />
              </View>
            </Marker>
          );
        })}
      </MapView>

      {isLoadingPois && (
        <View style={styles.loadingBadge}>
          <ActivityIndicator size="small" color="#fff" />
          <Text style={styles.loadingText}>Carregando pontos...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  marker: {
    backgroundColor: "#fff",
    borderRadius: 999,
    borderWidth: 2,
    padding: 6,
  },
  loadingBadge: {
    position: "absolute",
    top: 56,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(17,24,39,0.85)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  loadingText: { color: "#fff", fontSize: 12 },
});
