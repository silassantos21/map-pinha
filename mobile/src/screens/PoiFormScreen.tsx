import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { MapPressEvent, Marker, UrlTile } from "react-native-maps";

import { CARTOON_MAX_ZOOM, CARTOON_TILE_URL } from "../constants/map-theme";
import {
  attachPoiMedia,
  createPoi,
  deletePoi,
  fetchCategories,
  fetchGroups,
  fetchPoi,
  requestMediaPresignedUrl,
  updatePoi,
  uploadToPresignedUrl,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import type { RootStackParamList } from "../navigation/types";
import type { Category, Group, Poi, PoiVisibility } from "../types/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "PoiForm">;

const VISIBILITY_OPTIONS: { value: PoiVisibility; label: string }[] = [
  { value: "public", label: "Público" },
  { value: "followers", label: "Seguidores" },
  { value: "group", label: "Grupo" },
  { value: "private", label: "Só eu" },
];

// Mesmo centro aproximado do Brasil usado como fallback no MapScreen,
// mas já com zoom de bairro — aqui não há lista de POIs pra enquadrar
// enquanto nenhuma posição foi escolhida ainda.
const DEFAULT_REGION = { latitude: -15.793889, longitude: -47.882778, latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function PoiFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<{ key: string; name: "PoiForm"; params: RootStackParamList["PoiForm"] }>();
  const { token, currentUser } = useAuth();
  const poiId = route.params?.poiId;
  const isEditing = Boolean(poiId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [existingPoi, setExistingPoi] = useState<Poi | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<PoiVisibility>("public");
  const [groupId, setGroupId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null>(route.params?.initialLat ?? null);
  const [lng, setLng] = useState<number | null>(route.params?.initialLng ?? null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  // Mantém o mapa embutido centralizado sempre que a posição muda por um
  // caminho que não foi tocar nele mesmo (botão "usar minha localização
  // atual", ou carregar um POI existente pra editar) — tocar/arrastar no
  // próprio mapa já move a câmera sozinho, então reanimar aqui não atrapalha.
  useEffect(() => {
    if (lat !== null && lng !== null) {
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        300,
      );
    }
  }, [lat, lng]);

  useEffect(() => {
    (async () => {
      try {
        const [categoryList, groupList] = await Promise.all([fetchCategories(), fetchGroups(token)]);
        setCategories(categoryList);
        setGroups(groupList);

        if (poiId) {
          const poi = await fetchPoi(token, poiId);
          setExistingPoi(poi);
          setName(poi.name);
          setDescription(poi.description ?? "");
          setAddress(poi.address ?? "");
          setCategoryId(poi.category_id);
          setVisibility(poi.visibility);
          setGroupId(poi.group_id);
          setLat(poi.lat);
          setLng(poi.lng);
        } else if (categoryList.length > 0) {
          setCategoryId(categoryList[0].id);
        }
      } catch (error) {
        Alert.alert("Erro ao carregar", error instanceof Error ? error.message : "Tente de novo.");
      } finally {
        setLoading(false);
      }
    })();
  }, [poiId, token]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Autorize o acesso às fotos pra adicionar uma imagem.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPendingImageUri(result.assets[0].uri);
    }
  };

  const useCurrentLocation = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Autorize o acesso à localização.");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setLat(position.coords.latitude);
      setLng(position.coords.longitude);
    } catch (error) {
      // GPS desligado, sem sinal, ou falha do provedor de localização do
      // sistema — sem isso, o botão simplesmente não fazia nada, sem
      // feedback nenhum pro usuário (achado testando no emulador).
      Alert.alert(
        "Não foi possível obter sua localização",
        "Verifique se o GPS está ativado ou toque no mapa pra escolher o ponto manualmente.",
      );
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setLat(latitude);
    setLng(longitude);
  };

  const hasExistingMedia = (existingPoi?.media.length ?? 0) > 0;

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert("Nome obrigatório", "Dê um nome pro POI.");
    if (!categoryId) return Alert.alert("Categoria obrigatória", "Escolha uma categoria.");
    if (lat === null || lng === null) {
      return Alert.alert("Localização obrigatória", "Toque no mapa ou use sua posição atual.");
    }
    if (visibility === "group" && !groupId) {
      return Alert.alert("Grupo obrigatório", "Escolha um grupo pra essa visibilidade.");
    }
    if (!isEditing && !pendingImageUri) {
      return Alert.alert("Foto obrigatória", "Adicione ao menos 1 foto pro POI.");
    }

    setSaving(true);
    let createdPoiId: string | null = null;
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        category_id: categoryId,
        lat,
        lng,
        visibility,
        group_id: visibility === "group" ? groupId : null,
        icon_name: null,
      };

      const poi = isEditing
        ? await updatePoi(token, currentUser.id, poiId!, payload)
        : await createPoi(token, currentUser.id, payload);
      createdPoiId = isEditing ? null : poi.id;

      if (pendingImageUri) {
        const filename = pendingImageUri.split("/").pop() ?? "foto.jpg";
        const { upload_url, object_key } = await requestMediaPresignedUrl(
          token,
          filename,
          "image/jpeg",
          "image",
        );
        await uploadToPresignedUrl(upload_url, pendingImageUri, "image/jpeg");
        await attachPoiMedia(token, currentUser.id, poi.id, object_key, "image");
      } else if (!isEditing && !hasExistingMedia) {
        throw new Error("POI precisa de ao menos 1 foto");
      }

      navigation.goBack();
    } catch (error) {
      // Mesma regra da web (`poi-form-sheet.tsx`): se o upload de mídia
      // falhar depois de criar o POI, desfaz a criação — não deixa um POI
      // "vazio" (sem a foto obrigatória) pra trás.
      if (createdPoiId) {
        await deletePoi(token, createdPoiId).catch(() => undefined);
      }
      Alert.alert("Erro ao salvar", error instanceof Error ? error.message : "Tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Nome</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome do POI" />

      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={description}
        onChangeText={setDescription}
        placeholder="Opcional"
        multiline
      />

      <Text style={styles.label}>Endereço</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Opcional" />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.chipRow}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.chip, categoryId === category.id && styles.chipActive]}
            onPress={() => setCategoryId(category.id)}
          >
            <Text style={categoryId === category.id ? styles.chipTextActive : styles.chipText}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Visibilidade</Text>
      <View style={styles.chipRow}>
        {VISIBILITY_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.chip, visibility === option.value && styles.chipActive]}
            onPress={() => setVisibility(option.value)}
          >
            <Text style={visibility === option.value ? styles.chipTextActive : styles.chipText}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {visibility === "group" && (
        <>
          <Text style={styles.label}>Qual grupo</Text>
          <View style={styles.chipRow}>
            {groups.length === 0 && <Text style={styles.hint}>Você não tem grupos ainda.</Text>}
            {groups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={[styles.chip, groupId === group.id && styles.chipActive]}
                onPress={() => setGroupId(group.id)}
              >
                <Text style={groupId === group.id ? styles.chipTextActive : styles.chipText}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Localização</Text>
      <Text style={styles.hint}>
        {lat !== null && lng !== null
          ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          : "Toque no mapa abaixo pra escolher o ponto"}
      </Text>
      <View style={styles.mapPicker}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={
            lat !== null && lng !== null
              ? { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : DEFAULT_REGION
          }
          mapType="none"
          onPress={handleMapPress}
        >
          <UrlTile urlTemplate={CARTOON_TILE_URL} maximumZ={CARTOON_MAX_ZOOM} flipY={false} />
          {lat !== null && lng !== null && (
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              draggable
              onDragEnd={(event) => {
                const { latitude, longitude } = event.nativeEvent.coordinate;
                setLat(latitude);
                setLng(longitude);
              }}
            />
          )}
        </MapView>
      </View>
      <TouchableOpacity style={styles.secondaryButton} onPress={useCurrentLocation}>
        <Text style={styles.secondaryButtonText}>Usar minha localização atual</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Foto</Text>
      {pendingImageUri ? (
        <Image source={{ uri: pendingImageUri }} style={styles.preview} />
      ) : hasExistingMedia ? (
        <Image source={{ uri: existingPoi!.media[0].url }} style={styles.preview} />
      ) : null}
      <TouchableOpacity style={styles.secondaryButton} onPress={pickImage}>
        <Text style={styles.secondaryButtonText}>
          {pendingImageUri || hasExistingMedia ? "Trocar foto" : "Escolher foto"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryButtonText}>{isEditing ? "Salvar alterações" : "Criar POI"}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111827" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111827" },
  content: { padding: 16, gap: 8 },
  label: { color: "#9ca3af", fontSize: 13, marginTop: 12 },
  hint: { color: "#6b7280", fontSize: 13 },
  input: {
    backgroundColor: "#1f2937",
    color: "#fff",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#1f2937",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: "#3b82f6" },
  chipText: { color: "#d1d5db", fontSize: 13 },
  chipTextActive: { color: "#fff", fontSize: 13, fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#d1d5db" },
  mapPicker: { height: 220, borderRadius: 8, overflow: "hidden", marginVertical: 8 },
  preview: { width: "100%", height: 180, borderRadius: 8, marginBottom: 8 },
  primaryButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
