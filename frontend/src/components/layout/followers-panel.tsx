"use client";

import { Users as UsersIcon, UserRound } from "lucide-react";

import { PanelTrigger } from "@/components/layout/panel-trigger";
import { FollowToggleButton, UserSearchPanel } from "@/components/layout/user-search-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { MotionListItem } from "@/components/ui/motion-list-item";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useMyFollowers, useMyFollowing } from "@/hooks/use-my-follows";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import type { UserPublic } from "@/types/poi";

interface FollowersPanelProps {
  isAuthenticated: boolean;
}

function UserRow({ user }: { user: UserPublic }) {
  const viewUserProfile = useMapStore((s) => s.viewUserProfile);
  const avatarUrl = user.avatar_choice_url ?? user.avatar_url;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      <button
        type="button"
        onClick={() => viewUserProfile(user.id)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos)
          <img
            src={avatarUrl}
            alt=""
            className="size-8 shrink-0 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-4 text-muted-foreground" />
          </span>
        )}
        <p className="truncate text-sm font-medium text-foreground">{user.name ?? "Usuário"}</p>
      </button>
      <FollowToggleButton user={user} />
    </div>
  );
}

/** Painel "Social" (Fase 7) — ocupa o slot do rodapé que antes era um botão
 * próprio pro `ProfilePanel` (removido ali: o avatar do HUD já abre o mesmo
 * painel, ter os dois era redundante). Duas abas (Seguidores / Seguindo) —
 * "Grupos" tem botão próprio (`GroupsPanel`), separado daqui porque com 3
 * abas ficava apertado no mobile. Sem scroll infinito nem offset por página,
 * mesmo esquema "lista crescente por `limit`" do sininho de notificações.
 * Sem controle externo (nada mais precisa abrir este painel numa aba
 * específica) — `Sheet`/`Tabs` ficam uncontrolled mesmo. */
export function FollowersPanel({ isAuthenticated }: FollowersPanelProps) {
  const { data: followers } = useMyFollowers(isAuthenticated);
  const { data: following } = useMyFollowing(isAuthenticated);
  const isMobile = useMediaQuery("(max-width: 639px)");

  return (
    <Sheet>
      <PanelTrigger icon={UsersIcon} label="Social" disabled={!isAuthenticated} />

      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn("flex flex-col gap-0", isMobile && "h-[65vh]!")}
      >
        <SheetHeader className="flex-row items-center justify-between">
          <div>
            <SheetTitle className="font-display">Social</SheetTitle>
            <SheetDescription className="sr-only">
              Quem segue você e quem você segue.
            </SheetDescription>
          </div>
          <UserSearchPanel />
        </SheetHeader>

        <Tabs defaultValue="followers" className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <TabsList>
            <TabsTab value="followers">Seguidores</TabsTab>
            <TabsTab value="following">Seguindo</TabsTab>
          </TabsList>

          <TabsPanel value="followers" className="gap-2 overflow-y-auto">
            {(followers?.items.length ?? 0) === 0 ? (
              <EmptyState text="Ninguém te segue ainda." />
            ) : (
              followers?.items.map((user, index) => (
                <MotionListItem key={user.id} index={index}>
                  <UserRow user={user} />
                </MotionListItem>
              ))
            )}
          </TabsPanel>

          <TabsPanel value="following" className="gap-2 overflow-y-auto">
            {(following?.items.length ?? 0) === 0 ? (
              <EmptyState text="Você ainda não segue ninguém — use a busca de pessoas." />
            ) : (
              following?.items.map((user, index) => (
                <MotionListItem key={user.id} index={index}>
                  <UserRow user={user} />
                </MotionListItem>
              ))
            )}
          </TabsPanel>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
