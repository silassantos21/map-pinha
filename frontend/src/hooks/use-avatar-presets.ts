import { useQuery } from "@tanstack/react-query";

import { fetchAvatarPresets } from "@/lib/api-client";

export function useAvatarPresets(enabled: boolean) {
  return useQuery({
    queryKey: ["avatar-presets"],
    queryFn: fetchAvatarPresets,
    enabled,
    staleTime: Infinity, // galeria fixa, não muda em runtime
  });
}
