"use client";

import { LogOut, Pencil, Sparkles, UserRound } from "lucide-react";
import { useState } from "react";

import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useMyPois } from "@/hooks/use-my-pois";
import { useUserStats } from "@/hooks/use-user-stats";
import { signOutAction } from "@/lib/auth-actions";
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
 * `Sheet` controlada (`profilePanelOpen` no `map-store.ts`), não um
 * `SheetTrigger` uncontrolled isolado — tem dois gatilhos: o botão "Perfil"
 * do rodapé (`SheetTrigger` abaixo) e o avatar do HUD (`UserAvatarBadge`),
 * que precisam abrir a mesma instância. O botão "Sair" mora aqui dentro
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

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const displayedAvatarUrl = currentUser?.avatar_choice_url ?? userAvatarUrl;

  const handleSignOut = () => {
    setIsSigningOut(true);
    void signOutAction();
  };

  if (!isAuthenticated) return null;

  return (
    <Sheet open={profilePanelOpen} onOpenChange={setProfilePanelOpen}>
      <Tooltip>
        <TooltipTrigger render={<span className="pointer-events-auto inline-flex" />}>
          <SheetTrigger
            render={
              <Button
                size="icon-lg"
                variant="secondary"
                className="pointer-events-auto rounded-full shadow-lg"
              />
            }
          >
            <UserRound />
            <span className="sr-only">Abrir perfil</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Perfil</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Perfil</SheetTitle>
          <SheetDescription className="sr-only">
            Seu avatar, estatísticas e POIs cadastrados.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center gap-3">
            <Dialog open={avatarPickerOpen} onOpenChange={setAvatarPickerOpen}>
              <DialogTrigger
                render={
                  <button
                    type="button"
                    className="group relative shrink-0"
                    aria-label="Trocar avatar"
                  />
                }
              >
                {displayedAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos, sem domínio fixo configurado em next.config.mjs)
                  <img
                    src={displayedAvatarUrl}
                    alt=""
                    className="size-12 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <UserRound className="size-5 text-muted-foreground" />
                  </span>
                )}
                <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
                  <Pencil className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-display">Escolher avatar</DialogTitle>
                </DialogHeader>
                <AvatarPicker currentAvatarChoiceUrl={currentUser?.avatar_choice_url ?? null} />
              </DialogContent>
            </Dialog>
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
              ? `${myPois.length} POI(s) cadastrado(s) por você — toque pra voar até eles.`
              : 'Você ainda não cadastrou nenhum POI. Toque no "+" pra criar o primeiro.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {myPois.map((poi, index) => (
            <MotionListItem key={poi.id} index={index}>
              <button
                type="button"
                onClick={() => flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
                className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{poi.name}</p>
                  {poi.ai_category_slug && (
                    <span
                      className="flex shrink-0 items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                      title="A IA sugeriu uma categoria diferente pra esse POI — abra o pino no mapa pra ver"
                    >
                      <Sparkles className="size-2.5" /> sugestão
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {categoryNameById.get(poi.category_id) ?? "Sem categoria"}
                </p>
              </button>
            </MotionListItem>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
