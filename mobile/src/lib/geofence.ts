import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";

// Fase 10 Parte 5 — geofence nativo + notificação local, sem servidor de
// push (decisão registrada em docs/04_TIMELINE.md). Monitora os POIs
// favoritados + próprios do usuário; ao entrar na área, dispara uma
// notificação local com o nome do POI.
const GEOFENCE_TASK = "mapinha-proximity-geofence";
const NAMES_STORAGE_KEY = "mapinha_geofence_poi_names";
const RADIUS_METERS = 150;
// Limite documentado no plano (~20 iOS / ~100 Android) — usa o menor dos
// dois pra funcionar igual nas duas plataformas sem precisar de 2 listas.
const MAX_REGIONS = 20;

export interface GeofencedPoi {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

// `TaskManager.defineTask` precisa estar no escopo de módulo (não dentro de
// um componente) — é o próprio React Native quem reinvoca esse módulo numa
// JS task "headless" quando o evento chega com o app em segundo plano ou
// fechado, por isso o nome do POI não pode vir de estado em memória: é lido
// de volta do SecureStore a cada disparo.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;
  const { eventType, region } = data as {
    eventType: Location.GeofencingEventType;
    region: Location.LocationRegion;
  };
  if (eventType !== Location.GeofencingEventType.Enter) return;

  const raw = await SecureStore.getItemAsync(NAMES_STORAGE_KEY);
  const names: Record<string, string> = raw ? JSON.parse(raw) : {};
  const poiName = names[region.identifier ?? ""] ?? "um ponto favoritado";

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Você está perto de um POI!",
      body: `${poiName} está aqui perto.`,
    },
    trigger: null,
  });
});

export async function requestGeofencePermissions(): Promise<boolean> {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) return false;

  // Android 10+/iOS exigem esse 2º pedido separado pra monitorar localização
  // com o app em segundo plano — nunca pedir os dois de uma vez (a própria
  // Expo recomenda explicar o primeiro passo antes de pedir o segundo).
  const background = await Location.requestBackgroundPermissionsAsync();
  if (!background.granted) return false;

  // Android 13+ exige permissão em runtime pra mostrar notificação (API 33,
  // `POST_NOTIFICATIONS`) — sem isso, `scheduleNotificationAsync` falha
  // silenciosamente mesmo com o geofence funcionando.
  const notifications = await Notifications.requestPermissionsAsync();
  return notifications.granted;
}

async function ensureNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("proximity", {
    name: "Proximidade de POIs",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// Reconcilia a lista de regiões monitoradas — chamado sempre que a lista de
// favoritos/POIs próprios do usuário muda (reinicia do zero com o conjunto
// atualizado, mais simples que calcular o diff).
export async function syncGeofences(pois: GeofencedPoi[]): Promise<void> {
  const alreadyStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (alreadyStarted) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
  if (pois.length === 0) return;

  const hasPermission = await Location.getBackgroundPermissionsAsync();
  if (!hasPermission.granted) return;

  await ensureNotificationChannel();

  const truncated = pois.slice(0, MAX_REGIONS);
  const names = Object.fromEntries(truncated.map((poi) => [poi.id, poi.name]));
  await SecureStore.setItemAsync(NAMES_STORAGE_KEY, JSON.stringify(names));

  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    truncated.map((poi) => ({
      identifier: poi.id,
      latitude: poi.lat,
      longitude: poi.lng,
      radius: RADIUS_METERS,
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}

export async function disableGeofences(): Promise<void> {
  const alreadyStarted = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
  if (alreadyStarted) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}
