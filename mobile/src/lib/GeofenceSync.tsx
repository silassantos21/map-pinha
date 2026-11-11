import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { fetchFavorites, fetchPois } from "./api";
import { useAuth } from "./auth-context";
import { syncGeofences } from "./geofence";

// Sem UI própria — só reconcilia as regiões de geofence sempre que a lista
// de favoritos/POIs próprios muda (Parte 5, plano: "reiniciar o geofencing
// com o conjunto atualizado"). Não pede permissão aqui: só sincroniza se a
// permissão de segundo plano já tiver sido concedida antes (ver botão
// "Ativar avisos de proximidade" em FavoritesScreen) — nunca interrompe o
// usuário com um prompt nesta montagem silenciosa em segundo plano.
export function GeofenceSync() {
  const { token, currentUser } = useAuth();
  const favoritesQuery = useQuery({ queryKey: ["favorites"], queryFn: () => fetchFavorites(token) });
  const poisQuery = useQuery({ queryKey: ["pois", token], queryFn: () => fetchPois(token) });

  useEffect(() => {
    (async () => {
      const permission = await Location.getBackgroundPermissionsAsync();
      if (!permission.granted) return;

      const favorites = favoritesQuery.data ?? [];
      const ownPois = (poisQuery.data ?? []).filter((poi) => poi.user_id === currentUser.id);
      const combined = [...favorites, ...ownPois.filter((poi) => !favorites.some((f) => f.id === poi.id))];

      await syncGeofences(combined.map((poi) => ({ id: poi.id, name: poi.name, lat: poi.lat, lng: poi.lng })));
    })();
  }, [favoritesQuery.data, poisQuery.data, currentUser.id]);

  return null;
}
