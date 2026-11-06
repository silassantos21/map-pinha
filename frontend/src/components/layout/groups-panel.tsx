"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Crown, Plus, Trash2, UserPlus, UserRound, UsersRound, X } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { MotionListItem } from "@/components/ui/motion-list-item";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGroupDetail, useMyGroups, usePendingInvites } from "@/hooks/use-groups";
import { useUserSearch } from "@/hooks/use-user-search";
import {
  acceptGroupInvite,
  createGroup,
  deleteGroup,
  inviteToGroup,
  leaveOrRemoveFromGroup,
} from "@/lib/api-client";
import { toast } from "@/components/ui/toast";
import { useMapStore } from "@/stores/map-store";
import type { GroupInvite } from "@/types/poi";

interface GroupsPanelProps {
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

function PendingInviteRow({
  invite,
  currentUserId,
}: {
  invite: GroupInvite;
  currentUserId?: string | null;
}) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] }),
      queryClient.invalidateQueries({ queryKey: ["my-groups"] }),
    ]);

  const respond = async (accept: boolean) => {
    if (!currentUserId) return;
    setIsPending(true);
    try {
      if (accept) {
        await acceptGroupInvite(invite.group_id);
      } else {
        // Recusar = mesma ação de "sair" no backend (apaga a linha).
        await leaveOrRemoveFromGroup(invite.group_id, currentUserId);
      }
      await invalidate();
      toast.add({
        title: accept ? "Convite aceito" : "Convite recusado",
        description: invite.group_name,
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Não foi possível responder ao convite",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{invite.group_name}</p>
        <p className="text-xs text-muted-foreground">
          Convite de {invite.invited_by_name ?? "alguém"}
        </p>
      </div>
      <Button size="icon-sm" variant="default" onClick={() => respond(true)} disabled={isPending}>
        <Check className="size-3.5" />
      </Button>
      <Button size="icon-sm" variant="outline" onClick={() => respond(false)} disabled={isPending}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}

function CreateGroupDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await createGroup(name.trim());
      await queryClient.invalidateQueries({ queryKey: ["my-groups"] });
      toast.add({ title: "Grupo criado", description: name.trim(), type: "success" });
      setName("");
      setOpen(false);
    } catch (error) {
      toast.add({
        title: "Não foi possível criar o grupo",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}>
        <Plus className="size-3.5" />
        Criar grupo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Criar grupo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome do grupo"
            maxLength={100}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <Button type="button" onClick={handleCreate} disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Criando..." : "Criar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddMemberSearch({ groupId }: { groupId: string }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const { data: results = [] } = useUserSearch(debouncedQuery, true);
  const queryClient = useQueryClient();
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  const invite = async (userId: string) => {
    setPendingUserId(userId);
    try {
      await inviteToGroup(groupId, userId);
      await queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] });
      toast.add({ title: "Convite enviado", type: "success" });
      setQuery("");
    } catch (error) {
      toast.add({
        title: "Não foi possível convidar",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar pessoa pra convidar..."
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
      {results.map((user) => (
        <div key={user.id} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
          <p className="min-w-0 flex-1 truncate text-sm text-foreground">{user.name ?? "Usuário"}</p>
          <Button
            type="button"
            size="sm"
            onClick={() => invite(user.id)}
            disabled={pendingUserId === user.id}
          >
            Convidar
          </Button>
        </div>
      ))}
    </div>
  );
}

function GroupDetailView({
  groupId,
  currentUserId,
  onBack,
  onDeleted,
}: {
  groupId: string;
  currentUserId?: string | null;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const { data: group } = useGroupDetail(groupId);
  const queryClient = useQueryClient();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!group) return null;

  const isOwner = group.my_role === "owner";

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["group-detail", groupId] }),
      queryClient.invalidateQueries({ queryKey: ["my-groups"] }),
    ]);

  const handleLeave = async () => {
    if (!currentUserId) return;
    setIsLeaving(true);
    try {
      await leaveOrRemoveFromGroup(groupId, currentUserId);
      await invalidate();
      toast.add({ title: "Você saiu do grupo", description: group.name, type: "success" });
      onBack();
    } catch (error) {
      toast.add({
        title: "Não foi possível sair do grupo",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup(groupId);
      await invalidate();
      toast.add({ title: "Grupo excluído", description: group.name, type: "success" });
      onDeleted();
    } catch (error) {
      toast.add({
        title: "Não foi possível excluir o grupo",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const removeMember = async (userId: string) => {
    try {
      await leaveOrRemoveFromGroup(groupId, userId);
      await invalidate();
      toast.add({ title: "Membro removido", type: "success" });
    } catch (error) {
      toast.add({
        title: "Não foi possível remover",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Voltar pros grupos
        </button>

        <p className="font-display text-base text-foreground">{group.name}</p>

        {isOwner && <AddMemberSearch groupId={groupId} />}

        <div className="flex flex-col gap-1.5">
          {group.members.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2.5"
            >
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos)
                <img
                  src={member.avatar_url}
                  alt=""
                  className="size-7 shrink-0 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <UserRound className="size-3.5 text-muted-foreground" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{member.name ?? "Usuário"}</p>
                {member.status === "pending" && (
                  <p className="text-[10px] text-muted-foreground">Convite pendente</p>
                )}
              </div>
              {member.role === "owner" && <Crown className="size-3.5 shrink-0 text-amber-400" />}
              {isOwner && member.role !== "owner" && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => removeMember(member.user_id)}
                  aria-label="Remover do grupo"
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <SheetFooter>
        {isOwner ? (
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button type="button" variant="destructive" size="sm" disabled={isDeleting} />}
            >
              <Trash2 className="size-3.5" />
              {isDeleting ? "Excluindo..." : "Excluir grupo"}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir grupo</AlertDialogTitle>
                <AlertDialogDescription>
                  Excluir &quot;{group.name}&quot;? Os membros perdem acesso aos POIs desse grupo.
                  Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLeave}
            disabled={isLeaving}
          >
            {isLeaving ? "Saindo..." : "Sair do grupo"}
          </Button>
        )}
      </SheetFooter>
    </div>
  );
}

function GroupsPanelBody({ currentUserId }: { currentUserId?: string | null }) {
  const { data: groups = [] } = useMyGroups(true);
  const { data: invites = [] } = usePendingInvites(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  if (selectedGroupId) {
    return (
      <GroupDetailView
        groupId={selectedGroupId}
        currentUserId={currentUserId}
        onBack={() => setSelectedGroupId(null)}
        onDeleted={() => setSelectedGroupId(null)}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4">
      {invites.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground">Convites pendentes</p>
          {invites.map((invite) => (
            <PendingInviteRow key={invite.group_id} invite={invite} currentUserId={currentUserId} />
          ))}
        </div>
      )}

      <CreateGroupDialog />

      {groups.length === 0 ? (
        <EmptyState text="Você ainda não faz parte de nenhum grupo." />
      ) : (
        groups.map((group, index) => (
          <MotionListItem key={group.id} index={index}>
            <button
              type="button"
              onClick={() => setSelectedGroupId(group.id)}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted"
            >
              <UserPlus className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {group.member_count} {group.member_count === 1 ? "membro" : "membros"}
                </p>
              </div>
              {group.my_role === "owner" && <Crown className="size-3.5 shrink-0 text-amber-400" />}
            </button>
          </MotionListItem>
        ))
      )}
    </div>
  );
}

/** Painel "Grupos" — botão próprio no rodapé (antes era a 3ª aba do painel
 * Social; separado porque, com 3 abas, "Grupos" ficava apertado no mobile).
 * Controlado (`groupsPanelOpen` no `map-store`) pra abrir direto a partir de
 * uma notificação de convite, não só pelo próprio botão do rodapé. */
export function GroupsPanel({ isAuthenticated, currentUserId }: GroupsPanelProps) {
  const groupsPanelOpen = useMapStore((s) => s.groupsPanelOpen);
  const setGroupsPanelOpen = useMapStore((s) => s.setGroupsPanelOpen);

  if (!isAuthenticated) return null;

  return (
    <Sheet open={groupsPanelOpen} onOpenChange={setGroupsPanelOpen}>
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
            <UsersRound />
            <span className="sr-only">Grupos</span>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent side="left">Grupos</TooltipContent>
      </Tooltip>

      <SheetContent className="flex flex-col gap-0">
        <SheetHeader>
          <SheetTitle className="font-display">Grupos</SheetTitle>
          <SheetDescription className="sr-only">
            Convites pendentes e grupos fechados dos quais você faz parte.
          </SheetDescription>
        </SheetHeader>

        <GroupsPanelBody currentUserId={currentUserId} />
      </SheetContent>
    </Sheet>
  );
}
