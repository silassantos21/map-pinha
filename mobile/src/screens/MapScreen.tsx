import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import MapView, { LongPressEvent, Marker, UrlTile } from "react-native-maps";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { CARTOON_MAX_ZOOM, CARTOON_TILE_URL } from "../constants/map-theme";
import { resolveIconName } from "../constants/poi-icons";
import { fetchCategories, fetchPois } from "../lib/api";
import type { RootStackParamList } from "../navigation/types";

interface MapScreenProps {
  token: string;
}

// Centro aproximado do Brasil — só o ponto de partida antes dos POIs
// carregarem (ou se o usuário não tiver nenhum ainda); assim que a lista
// chega, o mapa ajusta o zoom pra enquadrar os POIs de verdade (ver
// `useEffect` abaixo) — sem geolocalização nem "seguir minha posição"
// nesta primeira versão (fica pra quando a Parte 5 — geofence — chegar).
const INITIAL_REGION = {
  latitude: -15.793889,
  longitude: -47.882778,
  latitudeDelta: 0.5,
  longitudeDelta: 0.5,
};

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function MapScreen({ token }: MapScreenProps) {
  const navigation = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const { data: pois, isLoading: isLoadingPois } = useQuery({
    queryKey: ["pois", token],
    queryFn: () => fetchPois(token),
  });
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  // Assim que os POIs chegam, enquadra o mapa neles em vez de deixar a
  // visão inicial (país inteiro) — com 1 POI só, `fitToCoordinates` não
  // muda o zoom sozinho (limitação conhecida do Android), por isso esse
  // caso usa `animateToRegion` com um zoom próximo fixo.
  useEffect(() => {
    if (!pois || pois.length === 0 || !mapRef.current) return;
    if (pois.length === 1) {
      mapRef.current.animateToRegion(
        { latitude: pois[0].lat, longitude: pois[0].lng, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    } else {
      mapRef.current.fitToCoordinates(
        pois.map((poi) => ({ latitude: poi.lat, longitude: poi.lng })),
        { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true },
      );
    }
  }, [pois]);

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category]));

  const handleLongPress = (event: LongPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    navigation.navigate("PoiForm", { initialLat: latitude, initialLng: longitude });
  };

  return (
    <View style={styles.container}>
      {/* mapType="none": sem isso, o MapView sempre mostra o mapa padrão do
      Google por baixo de qualquer UrlTile — a Stadia não "substitui" nada
      sozinha, só sobrepõe. */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        mapType="none"
        onLongPress={handleLongPress}
      >
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
              onPress={() => navigation.navigate("PoiDetail", { poiId: poi.id })}
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

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate("PoiForm", undefined)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "#fff", fontSize: 28, fontWeight: "700", marginTop: -2 },
});
