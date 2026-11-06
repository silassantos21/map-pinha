import { useQuery } from "@tanstack/react-query";

import { fetchGroupDetail, fetchMyGroups, fetchPendingInvites } from "@/lib/api-client";

export function useMyGroups(enabled: boolean) {
  return useQuery({
    queryKey: ["my-groups"],
    queryFn: fetchMyGroups,
    enabled,
  });
}

export function usePendingInvites(enabled: boolean) {
  return useQuery({
    queryKey: ["pending-invites"],
    queryFn: fetchPendingInvites,
    enabled,
  });
}

export function useGroupDetail(groupId: string | null) {
  return useQuery({
    queryKey: ["group-detail", groupId],
    queryFn: () => fetchGroupDetail(groupId as string),
    enabled: groupId !== null,
  });
}
