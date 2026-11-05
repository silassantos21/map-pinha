"use client";

import { useQueryClient } from "@tanstack/react-query";
import { UserRound, UserSearch } from "lucide-react";
import { useState } from "react";

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
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUserSearch } from "@/hooks/use-user-search";
import { followUser, unfollowUser } from "@/lib/api-client";
import { useMapStore } from "@/stores/map-store";
import type { UserPublic } from "@/types/poi";

interface UserSearchPanelProps {
  isAuthenticated: boolean;
}

function FollowToggleButton({ user }: { user: UserPublic }) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const isFollowing = user.is_following ?? false;

  const handleClick = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsPending(true);
    try {
      if (isFollowing) {
        await unfollowUser(user.id);
      } else {
        await followUser(user.id);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-search"] }),
        queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] }),
      ]);
    } catch {
      toast.add({ title: "Não foi possível atualizar", type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isFollowing ? "secondary" : "default"}
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0"
    >
      {isFollowing ? "Seguindo" : "Seguir"}
    </Button>
  );
}

export function UserSearchPanel({ isAuthenticated }: UserSearchPanelProps) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [] } = useUserSearch(debouncedQuery, isAuthenticated);
  const viewUserProfile = useMapStore((s) => s.viewUserProfile);

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
            <UserSearch />
            <span className="sr-only">Buscar pessoas</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Buscar pessoas</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader>
          <SheetTitle className="font-display">Buscar pessoas</SheetTitle>
          <SheetDescription className="sr-only">
            Busque por nome pra seguir outros usuários do MaPinha.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome..."
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="text-xs text-muted-foreground">Digite ao menos 2 caracteres.</p>
          )}
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {results.map((user, index) => {
            const avatarUrl = user.avatar_choice_url ?? user.avatar_url;
            return (
              <MotionListItem key={user.id} index={index}>
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
                    <p className="truncate text-sm font-medium text-foreground">
                      {user.name ?? "Usuário"}
                    </p>
                  </button>
                  <FollowToggleButton user={user} />
                </div>
              </MotionListItem>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
