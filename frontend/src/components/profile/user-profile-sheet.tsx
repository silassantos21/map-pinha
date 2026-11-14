"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useState } from "react";

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useUserPois } from "@/hooks/use-user-pois";
import { useUserProfile } from "@/hooks/use-user-profile";
import { followUser, unfollowUser } from "@/lib/api-client";
import { resolveIconName } from "@/lib/poi-icons";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

interface UserProfileSheetProps {
  currentUserId?: string | null;
}

/** Sheet de perfil de outra pessoa (Fase 7) — sem `SheetTrigger` próprio:
 * abre via `viewUserProfile(id)` do store, chamado pela busca de pessoas
 * ou por uma notificação de novo seguidor. Mesmo padrão visual do avatar e
 * dos cards de estatística do `ProfilePanel`, sem o botão de trocar avatar
 * (isso só existe pro próprio usuário, ver `ProfilePanel`) e sem lista de
 * seguidores/seguindo navegável (essa é só pra sua própria, ver
 * `FollowersPanel`) — aqui só a contagem. Avatar abre num `Dialog` de
 * visualização (ver foto ampliada + fechar), não um editor. */
export function UserProfileSheet({ currentUserId }: UserProfileSheetProps) {
  const viewedUserId = useMapStore((s) => s.viewedUserId);
  const closeUserProfile = useMapStore((s) => s.closeUserProfile);
  const flyToPoi = useMapStore((s) => s.flyToPoi);
  const { data: profile } = useUserProfile(viewedUserId);
  const { data: pois = [] } = useUserPois(viewedUserId);
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-profile", profile.id] }),
        queryClient.invalidateQueries({ queryKey: ["user-pois", profile.id] }),
        queryClient.invalidateQueries({ queryKey: ["my-followers"] }),
        queryClient.invalidateQueries({ queryKey: ["my-following"] }),
      ]);
      toast.add({
        title: profile.is_following ? "Deixou de seguir" : "Seguindo",
        description: profile.name ?? undefined,
        type: "success",
      });
    } catch {
      toast.add({ title: "Não foi possível atualizar", type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Sheet open={viewedUserId !== null} onOpenChange={(open) => !open && closeUserProfile()}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn("flex flex-col", isMobile && "h-[65vh]!")}
      >
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
                <Dialog>
                  <DialogTrigger render={<button type="button" aria-label="Ver foto de perfil" />}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos) */}
                    <img
                      src={avatarUrl}
                      alt=""
                      className="size-12 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos) */}
                    <img
                      src={avatarUrl}
                      alt=""
                      className="w-full rounded-xl object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </DialogContent>
                </Dialog>
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

            {pois.length > 0 && (
              <p className="text-xs font-medium text-muted-foreground">
                Marcadores de {isOwnProfile ? "você" : (profile.name ?? "usuário")}
              </p>
            )}
          </div>
        )}

        {pois.length > 0 && (
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
            {pois.map((poi, index) => {
              const Icon = resolveIconName(poi.icon_name ?? poi.category_icon_name);
              return (
                <MotionListItem key={poi.id} index={index}>
                  <button
                    type="button"
                    onClick={() => {
                      flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng });
                      closeUserProfile();
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-muted"
                    style={{ borderLeftColor: poi.category_color_hex }}
                  >
                    <Icon className="size-4 shrink-0" style={{ color: poi.category_color_hex }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{poi.name}</p>
                      <p className="text-xs text-muted-foreground">{poi.category_name}</p>
                    </div>
                  </button>
                </MotionListItem>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
