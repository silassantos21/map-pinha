"use client";

import { Users as UsersIcon, UserRound } from "lucide-react";

import { FollowToggleButton } from "@/components/layout/user-search-panel";
import { Button } from "@/components/ui/button";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMyFollowers, useMyFollowing } from "@/hooks/use-my-follows";
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

function EmptyState({ text }: { text: string }) {
  return <p className="px-1 text-xs text-muted-foreground">{text}</p>;
}

/** Painel "Seguidores e seguindo" (Fase 7) — ocupa o slot do rodapé que
 * antes era um botão próprio pro `ProfilePanel` (removido ali: o avatar do
 * HUD já abre o mesmo painel, ter os dois era redundante). Duas abas, cada
 * uma com sua própria lista — sem scroll infinito nem offset por página,
 * mesmo esquema "lista crescente por `limit`" do sininho de notificações. */
export function FollowersPanel({ isAuthenticated }: FollowersPanelProps) {
  const { data: followers } = useMyFollowers(isAuthenticated);
  const { data: following } = useMyFollowing(isAuthenticated);

  if (!isAuthenticated) return null;

  return (
    <Sheet>
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
            <UsersIcon />
            <span className="sr-only">Seguidores e seguindo</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Seguidores e seguindo</TooltipContent>
      </Tooltip>

      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="font-display">Seguidores e seguindo</SheetTitle>
          <SheetDescription className="sr-only">
            Quem segue você e quem você segue, em duas abas.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="followers" className="flex min-h-0 flex-1 flex-col gap-3 px-4">
          <TabsList>
            <TabsTab value="followers">Seguidores ({followers?.total ?? 0})</TabsTab>
            <TabsTab value="following">Seguindo ({following?.total ?? 0})</TabsTab>
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
