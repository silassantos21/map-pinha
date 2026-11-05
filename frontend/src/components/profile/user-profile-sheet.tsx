"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { followUser, unfollowUser } from "@/lib/api-client";
import { useMapStore } from "@/stores/map-store";

interface UserProfileSheetProps {
  currentUserId?: string | null;
}

/** Sheet de perfil de outra pessoa (Fase 7) — sem `SheetTrigger` próprio:
 * abre via `viewUserProfile(id)` do store, chamado pela busca de pessoas
 * ou por uma notificação de novo seguidor. Mesmo padrão visual do avatar e
 * dos cards de estatística do `ProfilePanel`, sem o botão de trocar avatar
 * (isso só existe pro próprio usuário) e sem lista de seguidores/seguindo
 * navegável (o roadmap pede só a contagem). */
export function UserProfileSheet({ currentUserId }: UserProfileSheetProps) {
  const viewedUserId = useMapStore((s) => s.viewedUserId);
  const closeUserProfile = useMapStore((s) => s.closeUserProfile);
  const { data: profile } = useUserProfile(viewedUserId);
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const isOwnProfile = viewedUserId !== null && viewedUserId === currentUserId;
  const avatarUrl = profile ? profile.avatar_choice_url ?? profile.avatar_url : null;

  const handleFollowToggle = async () => {
    if (!profile) return;
    setIsPending(true);
    try {
      if (profile.is_following) {
        await unfollowUser(profile.id);
      } else {
        await followUser(profile.id);
      }
      await queryClient.invalidateQueries({ queryKey: ["user-profile", profile.id] });
    } catch {
      toast.add({ title: "Não foi possível atualizar", type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Sheet open={viewedUserId !== null} onOpenChange={(open) => !open && closeUserProfile()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Perfil</SheetTitle>
          <SheetDescription className="sr-only">
            Avatar, estatísticas e opção de seguir este usuário.
          </SheetDescription>
        </SheetHeader>

        {profile && (
          <div className="flex flex-col gap-4 px-4">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos)
                <img
                  src={avatarUrl}
                  alt=""
                  className="size-12 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-5 text-muted-foreground" />
                </span>
              )}
              <p className="truncate font-display text-base text-foreground">
                {profile.name ?? "Usuário"}
              </p>
            </div>

            {!isOwnProfile && (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] disabled:opacity-60"
              >
                {profile.is_following ? "Deixar de seguir" : "Seguir"}
              </button>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="font-display text-xl text-primary">{profile.followers_count}</p>
                <p className="text-[11px] text-muted-foreground">seguidores</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="font-display text-xl text-primary">{profile.following_count}</p>
                <p className="text-[11px] text-muted-foreground">seguindo</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <p className="font-display text-xl text-primary">{profile.total_pois}</p>
                <p className="text-[11px] text-muted-foreground">pontos</p>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
