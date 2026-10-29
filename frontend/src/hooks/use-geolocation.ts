"use client";

import { useEffect, useState } from "react";

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- precisa ficar no efeito (só roda no cliente): checar `navigator` durante o render quebraria o SSR
      setState({ position: null, error: "Geolocalização não suportada" });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
        });
      },
      (err) => {
        setState({ position: null, error: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 15000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
