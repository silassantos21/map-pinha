"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Bell, UserRound } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useNotifications } from "@/hooks/use-notifications";
import { fetchPoiById, markAllNotificationsRead, markNotificationRead } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import type { AppNotification } from "@/types/poi";

interface NotificationBellProps {
  userId?: string | null;
}

function formatNotificationText(n: AppNotification): string {
  const actor = n.actor_name ?? "Alguém";
  switch (n.type) {
    case "new_follower":
      return `${actor} começou a seguir você`;
    case "poi_reaction":
      return `${actor} reagiu com ${n.payload.emoji ?? "👍"} no seu POI ${n.payload.poi_name ?? ""}`;
    case "new_poi_from_followed":
      return `${actor} cadastrou um novo POI: ${n.payload.poi_name ?? ""}`;
    case "group_invite":
      return `${actor} te convidou pro grupo ${n.group_name ?? ""}`;
    case "poi_comment":
      return `${actor} comentou no seu POI ${n.payload.poi_name ?? ""}: "${n.payload.body_preview ?? ""}"`;
    case "group_invite_accepted":
      return `${actor} aceitou seu convite pro grupo ${n.group_name ?? ""}`;
    default:
      return actor;
  }
}

function formatRelativeTime(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const isAuthenticated = userId != null;
  const [limit, setLimit] = useState(20);
  const { data } = useNotifications(isAuthenticated, limit);
  const queryClient = useQueryClient();
  const viewUserProfile = useMapStore((s) => s.viewUserProfile);
  const flyToPoi = useMapStore((s) => s.flyToPoi);
  const selectPoi = useMapStore((s) => s.selectPoi);
  const openGroupInvites = useMapStore((s) => s.openGroupInvites);

  if (!isAuthenticated) return null;

  const items = data?.items ?? [];
  const unreadCount = data?.unread_count ?? 0;

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    await invalidateNotifications();
  };

  const handleItemClick = async (notification: AppNotification) => {
    if (notification.read_at === null) {
      await markNotificationRead(notification.id);
      await invalidateNotifications();
    }

    if (notification.type === "new_follower") {
      viewUserProfile(notification.actor_id);
      return;
    }

    if (notification.type === "group_invite" || notification.type === "group_invite_accepted") {
      openGroupInvites();
      return;
    }

    if (notification.poi_id) {
      try {
        const poi = await fetchPoiById(notification.poi_id);
        flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng });
        selectPoi(poi.id);
      } catch {
        // POI pode ter sido excluído nesse meio tempo — só marca como lido.
      }
    }
  };

  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger render={<span className="pointer-events-auto relative inline-flex" />}>
          <SheetTrigger
            render={
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur-md"
                aria-label="Notificações"
              />
            }
          >
            <Bell className="size-4 text-foreground" />
            <Badge count={unreadCount} />
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Notificações</TooltipContent>
      </Tooltip>

      <SheetContent>
        <SheetHeader className="flex-row items-center justify-between">
          <div>
            <SheetTitle className="font-display">Notificações</SheetTitle>
            <SheetDescription className="sr-only">
              Lista de notificações recentes, mais recentes primeiro.
            </SheetDescription>
          </div>
          {unreadCount > 0 && (
            <Button type="button" size="sm" variant="ghost" onClick={handleMarkAllRead}>
              Marcar tudo como lido
            </Button>
          )}
        </SheetHeader>

        <div className="flex flex-col gap-2 overflow-y-auto px-4">
          {items.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhuma notificação por aqui ainda.</p>
          )}
          {items.map((notification) => {
            const avatarUrl = notification.actor_avatar_url;
            // Notificação já lida: mesmo conteúdo, só mais apagada (sem o
            // ponto de "não lida") — fica fácil escanear o que é novo sem
            // esconder o histórico.
            const isRead = notification.read_at !== null;
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleItemClick(notification)}
                className={cn(
                  "flex items-start gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted",
                  isRead ? "bg-muted/40 opacity-60" : "bg-card",
                )}
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
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p className="text-sm text-foreground">
                    {formatNotificationText(notification)}
                    {!isRead && (
                      <span className="ml-1.5 inline-block size-1.5 rounded-full bg-primary align-middle" />
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {items.length >= limit && (
          <div className="flex justify-center px-4 pb-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setLimit((l) => l + 20)}
            >
              Carregar mais
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
