"use client";

import { LogOut, Pencil, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";

import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMyPois } from "@/hooks/use-my-pois";
import { useUserStats } from "@/hooks/use-user-stats";
import { signOutAction } from "@/lib/auth-actions";
import { getPoiIcon } from "@/lib/poi-icons";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";

interface ProfilePanelProps {
  isAuthenticated: boolean;
  userName?: string | null;
  userAvatarUrl?: string | null;
}

/** Painel "Perfil" (Sprint 6) — avatar + nome + estatísticas no topo, lista
 * de "Meus POIs" embaixo (era um painel à parte, `my-pois-panel.tsx`; juntei
 * os dois porque o pedido original — "seus POIs, estatísticas, avatar" — é
 * essencialmente este painel com uma cabeça nova, e ter dois botões
 * parecidos no HUD pra "ver meus POIs" ia confundir mais que ajudar). Segue
 * o mesmo padrão de overlay responsivo (`Sheet`) dos demais painéis, não
 * uma rota/página separada — decisão de arquitetura registrada desde o
 * Sprint 1 (ver SPRINTS.md).
 *
 * `Sheet` controlada (`profilePanelOpen` no `map-store.ts`), sem `SheetTrigger`
 * próprio — abre só via avatar do HUD (`UserAvatarBadge`, chama
 * `setProfilePanelOpen(true)` direto). O botão "Sair" mora aqui dentro
 * (entre o avatar e as estatísticas) em vez do avatar do HUD deslogar direto
 * — tocar sem querer no avatar e já sair da conta sem confirmação nenhuma
 * era surpreendente demais.
 */
export function ProfilePanel({ isAuthenticated, userName, userAvatarUrl }: ProfilePanelProps) {
  const { data: myPois = [] } = useMyPois(isAuthenticated);
  const { data: categories } = useCategories();
  const { data: stats } = useUserStats(isAuthenticated);
  // `avatar_choice_url` vem do banco (não da sessão NextAuth, que só é
  // atualizada no login) — precisa de uma busca à parte pra refletir uma
  // troca de avatar na hora, sem precisar relogar.
  const { data: currentUser } = useCurrentUser(isAuthenticated);
  const flyToPoi = useMapStore((s) => s.flyToPoi);
  const profilePanelOpen = useMapStore((s) => s.profilePanelOpen);
  const setProfilePanelOpen = useMapStore((s) => s.setProfilePanelOpen);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const displayedAvatarUrl = currentUser?.avatar_choice_url ?? userAvatarUrl;

  const handleSignOut = () => {
    setIsSigningOut(true);
    void signOutAction();
  };

  if (!isAuthenticated) return null;

  // Sem `SheetTrigger` próprio no rodapé: o avatar do HUD (`UserAvatarBadge`)
  // já abre este painel via `setProfilePanelOpen(true)` — ter os dois
  // (avatar E um botão redundante no rodapé) só duplicava o mesmo destino.
  // O slot do rodapé que antes era "Perfil" virou o `FollowersPanel`
  // (seguidores/seguindo), que não tinha lugar nenhum até agora.
  return (
    <Sheet open={profilePanelOpen} onOpenChange={setProfilePanelOpen}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn("flex flex-col", isMobile && "h-[65vh]!")}
      >
        <SheetHeader>
          <SheetTitle className="font-display">Perfil</SheetTitle>
          <SheetDescription className="sr-only">
            Seu avatar, estatísticas e Marcadores cadastrados.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {/* Ver a foto ampliada — alvo de clique é o avatar inteiro.
                  Separado do editar (badge no canto abaixo) pra não competir
                  pelo mesmo clique: antes, o avatar inteiro só abria o
                  seletor de avatar, sem jeito nenhum de só ver a foto atual
                  ampliada. */}
              {displayedAvatarUrl ? (
                <Dialog>
                  <DialogTrigger render={<button type="button" aria-label="Ver foto de perfil" />}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos, sem domínio fixo configurado em next.config.mjs) */}
                    <img
                      src={displayedAvatarUrl}
                      alt=""
                      className="size-12 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  </DialogTrigger>
                  <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos) */}
                    <img
                      src={displayedAvatarUrl}
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

              <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
                <DialogTrigger
                  render={
                    <button
                      type="button"
                      className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-secondary"
                      aria-label="Trocar avatar"
                    />
                  }
                >
                  <Pencil className="size-2.5 text-secondary-foreground" />
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-display">Escolher avatar</DialogTitle>
                  </DialogHeader>
                  <AvatarPicker currentAvatarChoiceUrl={currentUser?.avatar_choice_url ?? null} />
                </DialogContent>
              </Dialog>
            </div>
            <p className="truncate font-display text-base text-foreground">{userName ?? "Você"}</p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20 disabled:opacity-60"
          >
            <LogOut className="size-4" />
            {isSigningOut ? "Saindo..." : "Sair"}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="font-display text-xl text-primary">{stats?.total_pois ?? "–"}</p>
              <p className="text-[11px] text-muted-foreground">pontos cadastrados</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-center">
              <p className="font-display text-xl text-primary">
                {stats ? stats.total_km.toLocaleString("pt-BR") : "–"}
              </p>
              <p className="text-[11px] text-muted-foreground">km mapeados</p>
            </div>
          </div>

          <p className="text-xs font-medium text-muted-foreground">
            {myPois.length > 0
              ? `${myPois.length} Marcador(es) cadastrado(s) por você — toque pra voar até eles.`
              : 'Você ainda não cadastrou nenhum Marcador. Toque no "+" pra criar o primeiro.'}
          </p>
        </div>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4">
          {myPois.map((poi, index) => {
            const category = categoryById.get(poi.category_id);
            const Icon = getPoiIcon(poi, category);
            const categoryColor = category?.color_hex ?? "var(--border)";
            return (
              <MotionListItem key={poi.id} index={index}>
                <button
                  type="button"
                  onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
                  className="flex w-full items-center gap-2 rounded-lg border border-border border-l-4 bg-card p-3 text-left transition-colors hover:bg-muted"
                  style={{ borderLeftColor: categoryColor }}
                >
                  <Icon className="size-4 shrink-0" style={{ color: categoryColor }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">{poi.name}</p>
                      {poi.ai_category_slug && (
                        <span
                          className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                          title="A IA sugeriu uma categoria diferente pra esse Marcador — abra o pino no mapa pra ver"
                        >
                          <Sparkles className="size-2.5" /> sugestão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {category?.name ?? "Sem categoria"}
                    </p>
                  </div>
                </button>
              </MotionListItem>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
