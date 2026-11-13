"use client";

import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Howl } from "howler";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Pause,
  Pencil,
  Play,
  Send,
  Share2,
  SmilePlus,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { MotionListItem } from "@/components/ui/motion-list-item";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCategories } from "@/hooks/use-categories";
import { useComments } from "@/hooks/use-comments";
import { useFavorites } from "@/hooks/use-favorites";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePois } from "@/hooks/use-pois";
import { acceptAiSuggestion, createComment, deleteComment, dismissAiSuggestion } from "@/lib/api-client";
import { getPoiIcon, resolveIconName } from "@/lib/poi-icons";
import { cn } from "@/lib/utils";
import { useMapStore } from "@/stores/map-store";
import type { Category, Poi, PoiMedia, PoiReaction } from "@/types/poi";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];
const DEFAULT_BORDER_COLOR = "var(--border)";

function formatRegisteredDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDuration(seconds: number): string {
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

interface PoiDetailSheetProps {
  userId?: string | null;
}

/** Card de detalhes do POI aberto ao clicar num marcador. Era um Popup do
 * Leaflet (ancorado ao marcador) — virou uma Sheet fora da árvore do mapa,
 * igual o formulário de edição (`PoiFormSheet`), pra ficar imune ao que o
 * Leaflet/clustering faz internamente a cada pan/zoom (remover/readicionar
 * marcadores pra reagrupar clusters), que causava o marcador/popup
 * "piscando" mesmo com os dados do POI já estáveis. */
export function PoiDetailSheet({ userId }: PoiDetailSheetProps) {
  const selectedPoiId = useMapStore((s) => s.selectedPoiId);
  const deselectPoi = useMapStore((s) => s.deselectPoi);
  const startEditingPoi = useMapStore((s) => s.startEditingPoi);
  const startRouteTo = useMapStore((s) => s.startRouteTo);
  const isCreatingPoi = useMapStore((s) => s.isCreatingPoi);
  const editingPoiId = useMapStore((s) => s.editingPoiId);
  // Mesmo breakpoint do formulário de edição — abre do lado no desktop,
  // embaixo no mobile (pouco espaço de mapa pra tocar fora da Sheet).
  const isMobile = useMediaQuery("(max-width: 639px)");

  const { data: pois = [] } = usePois(userId);
  const poi = pois.find((p) => p.id === selectedPoiId) ?? null;

  // Nunca aberto junto com o formulário de criação/edição (mesmo lado da
  // tela) — `startCreatingPoi`/`startEditingPoi` já limpam `selectedPoiId`,
  // mas esta checagem extra cobre também o caso de clicar num marcador
  // enquanto o formulário já está aberto.
  const isOpen = selectedPoiId !== null && poi !== null && !isCreatingPoi && !editingPoiId;

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && deselectPoi()}
      // Não-modal, igual o formulário de edição: o mapa continua
      // clicável/arrastável por trás enquanto o card está aberto.
      modal={false}
      disablePointerDismissal
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn("flex flex-col gap-0 p-0", isMobile && "max-h-[75vh]")}
        showOverlay={false}
        showCloseButton={false}
      >
        {poi && (
          <PoiDetailContent
            key={poi.id}
            poi={poi}
            currentUserId={userId}
            onClose={deselectPoi}
            onEdit={() => startEditingPoi({ id: poi.id, lat: poi.lat, lng: poi.lng })}
            onRoute={() => {
              startRouteTo({ id: poi.id, name: poi.name, lat: poi.lat, lng: poi.lng });
              deselectPoi();
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

interface PoiDetailContentProps {
  poi: Poi;
  currentUserId?: string | null;
  onClose: () => void;
  onEdit: () => void;
  onRoute: () => void;
}

function PoiDetailContent({ poi, currentUserId, onClose, onEdit, onRoute }: PoiDetailContentProps) {
  const visuals = poi.media.filter((m) => m.media_type === "image" || m.media_type === "gif");
  const audioTracks = poi.media.filter((m) => m.media_type === "audio");
  const isOwner = currentUserId != null && poi.user_id === currentUserId;
  const isAuthenticated = currentUserId != null;
  const viewUserProfile = useMapStore((s) => s.viewUserProfile);

  const queryClient = useQueryClient();
  const { data: categories } = useCategories();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  // Fechado por padrão — endereço completo ocupava espaço demais no card,
  // competindo com foto/descrição/áudio (que devem ser o foco principal).
  const [isAddressOpen, setIsAddressOpen] = useState(false);

  const category = categories?.find((c) => c.id === poi.category_id);
  const categoryColor = category?.color_hex ?? DEFAULT_BORDER_COLOR;
  const CategoryIcon = getPoiIcon(poi, category);

  const { data: favorites } = useFavorites(isAuthenticated);
  const isFavorited = favorites?.some((favorite) => favorite.id === poi.id) ?? false;

  const invalidatePoi = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pois"] });
    await queryClient.invalidateQueries({ queryKey: ["poi", poi.id] });
    await queryClient.invalidateQueries({ queryKey: ["my-pois"] });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pois/${poi.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir o Marcador");
      onClose();
      await queryClient.invalidateQueries({ queryKey: ["pois"] });
      await queryClient.invalidateQueries({ queryKey: ["my-pois"] });
      toast.add({ title: "Marcador excluído", description: poi.name, type: "success" });
    } catch (error) {
      toast.add({
        title: "Não foi possível excluir",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
    }
  };

  const toggleFavorite = async (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsTogglingFavorite(true);
    try {
      const res = await fetch(`/api/pois/${poi.id}/favorite`, {
        method: isFavorited ? "DELETE" : "POST",
      });
      if (!res.ok) throw new Error("Falha ao atualizar favoritos");
      await queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.add({
        title: isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos",
        description: poi.name,
        type: "success",
      });
    } catch (error) {
      toast.add({
        title: "Não foi possível atualizar favoritos",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const shareLink = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}/p/${poi.slug}`;
    // Web Share API primeiro (mobile: abre o menu nativo de compartilhar);
    // sem suporte (a maioria dos desktops), cai pra copiar o link.
    if (navigator.share) {
      try {
        await navigator.share({ title: poi.name, url });
      } catch {
        // AbortError quando o usuário cancela o menu — não é erro de verdade
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.add({ title: "Link copiado", description: url, type: "success" });
    } catch {
      toast.add({ title: "Não foi possível copiar o link", type: "error" });
    }
  };

  const header = (
    <div className="flex flex-col gap-1 border-b border-border/60 pb-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {/* eslint-disable-next-line react-hooks/static-components -- CategoryIcon vem de um registro fixo (ICON_REGISTRY), referência estável */}
          <CategoryIcon className="size-4 shrink-0" style={{ color: categoryColor }} aria-hidden />
          <p className="truncate font-display text-sm text-foreground">{poi.name}</p>
          {isAuthenticated && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={toggleFavorite}
                    disabled={isTogglingFavorite}
                    className="shrink-0 text-muted-foreground hover:text-amber-400 disabled:opacity-50"
                    aria-label={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  />
                }
              >
                <Star className={cn("size-4", isFavorited && "fill-amber-400 text-amber-400")} />
              </TooltipTrigger>
              <TooltipContent>
                {isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {poi.visibility === "public" && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={shareLink}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Compartilhar"
                  />
                }
              >
                <Share2 className="size-4" />
              </TooltipTrigger>
              <TooltipContent>Compartilhar</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClose();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Fechar"
                />
              }
            >
              <X className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Fechar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          viewUserProfile(poi.user_id);
        }}
        className="flex items-center gap-1.5 self-start text-[11px] text-muted-foreground hover:text-foreground"
      >
        {poi.owner_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2 (hosts externos)
          <img
            src={poi.owner_avatar_url}
            alt=""
            className="size-4 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex size-4 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-2.5 text-muted-foreground" />
          </span>
        )}
        <span className="truncate">Criado por {isOwner ? "você" : (poi.owner_name ?? "alguém")}</span>
      </button>
    </div>
  );

  const body = (
    <>
      {isOwner && poi.ai_category_slug && (
        <AiSuggestionBanner poi={poi} categories={categories} onResolved={invalidatePoi} />
      )}
      {poi.description && <p className="text-xs text-muted-foreground">{poi.description}</p>}
      {visuals.length === 0 && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <CalendarDays className="size-3" />
          Registrado em {formatRegisteredDate(poi.created_at)}
        </p>
      )}

      {audioTracks.length > 0 && (
        <div className="flex flex-col gap-1.5 pb-1">
          {audioTracks.map((track, index) => (
            <AudioTrackButton key={track.id} url={track.url} index={index} />
          ))}
        </div>
      )}
    </>
  );

  // Setor próprio pro endereço/coordenadas — separado da descrição/mídia
  // acima e dos botões de ação abaixo. Expansível e fechado por padrão: o
  // endereço completo ocupava espaço demais no card, competindo com
  // foto/descrição/áudio (que devem ser o foco principal do espaço).
  const addressSection = (
    <div className="rounded-lg border border-border/60 bg-muted/20">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsAddressOpen((open) => !open);
        }}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <MapPin className="size-3.5" />
          Endereço e coordenadas
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", isAddressOpen && "rotate-180")}
        />
      </button>
      {isAddressOpen && (
        <div className="flex flex-col gap-1 border-t border-border/60 px-2.5 py-2">
          {poi.address && (
            <p className="flex items-start gap-1 text-xs text-muted-foreground">
              <span className="min-w-0 flex-1">{poi.address}</span>
              <CopyField value={poi.address} label="endereço" />
            </p>
          )}
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span>
              {poi.lat.toFixed(5)}, {poi.lng.toFixed(5)}
            </span>
            <CopyField value={`${poi.lat}, ${poi.lng}`} label="coordenadas" />
          </p>
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2">
      <div className="min-w-0">
        <ReactionsBar poi={poi} currentUserId={currentUserId} onReacted={invalidatePoi} />
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onRoute();
                }}
                aria-label="Como chegar"
                className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-foreground"
              />
            }
          >
            <Navigation className="size-3.5" />
          </TooltipTrigger>
          <TooltipContent>Como chegar</TooltipContent>
        </Tooltip>

        {isOwner && (
          <>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit();
                  }}
                  className="flex size-7 items-center justify-center rounded-md border border-border bg-muted text-foreground"
                />
              }
            >
              <Pencil className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>

          <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
            <Tooltip>
              <TooltipTrigger render={<span className="inline-flex" />}>
                <AlertDialogTrigger
                  render={
                    <button
                      type="button"
                      onClick={(event) => event.stopPropagation()}
                      disabled={isDeleting}
                      className="flex size-7 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive disabled:opacity-50"
                    />
                  }
                >
                  <Trash2 className="size-3.5" />
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{isDeleting ? "Excluindo..." : "Excluir"}</TooltipContent>
            </Tooltip>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Marcador</AlertDialogTitle>
                <AlertDialogDescription>
                  Excluir &quot;{poi.name}&quot;? Essa ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          </>
        )}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
    >
      {/* Faixa colorida por categoria no topo — era a borda do card antigo,
          vira um acento simples agora que o conteúdo preenche a Sheet. */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: categoryColor }} />

      <div className="flex flex-col gap-3 p-4 pb-0">{header}</div>

      {visuals.length > 0 && (
        <div className="mt-3 h-48 w-full shrink-0 overflow-hidden px-4">
          <div className="h-full w-full overflow-hidden rounded-lg">
            <ImageGallery poi={poi} visuals={visuals} />
          </div>
        </div>
      )}

      <div className="popup-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {body}
        {addressSection}
        <CommentsSection poi={poi} currentUserId={currentUserId} />
      </div>

      <div className="p-4 pt-0">{footer}</div>
    </motion.div>
  );
}

function AiSuggestionBanner({
  poi,
  categories,
  onResolved,
}: {
  poi: Poi;
  categories?: Category[];
  onResolved: () => void | Promise<void>;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const suggestedCategory = categories?.find((c) => c.slug === poi.ai_category_slug);
  const SuggestedIcon = resolveIconName(poi.ai_icon_name ?? suggestedCategory?.icon_name ?? "sparkles");

  const respond = async (event: React.MouseEvent, accept: boolean) => {
    event.stopPropagation();
    setIsSubmitting(true);
    try {
      if (accept) await acceptAiSuggestion(poi.id);
      else await dismissAiSuggestion(poi.id);
      await onResolved();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-2">
      {/* eslint-disable-next-line react-hooks/static-components -- SuggestedIcon vem de um registro fixo (ICON_REGISTRY), referência estável */}
      <SuggestedIcon
        className="mt-0.5 size-4 shrink-0"
        style={{ color: poi.ai_color_hex ?? "var(--primary)" }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-foreground">
          IA sugere a categoria <strong>{suggestedCategory?.name ?? poi.ai_category_slug}</strong>
        </p>
        {poi.ai_reasoning && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">{poi.ai_reasoning}</p>
        )}
        <div className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            onClick={(event) => respond(event, true)}
            disabled={isSubmitting}
            className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-50"
          >
            Usar
          </button>
          <button
            type="button"
            onClick={(event) => respond(event, false)}
            disabled={isSubmitting}
            className="rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground disabled:opacity-50"
          >
            Dispensar
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageGallery({ poi, visuals }: { poi: Poi; visuals: PoiMedia[] }) {
  const [index, setIndex] = useState(0);
  const current = visuals[index];
  const registeredAt = formatRegisteredDate(poi.created_at);

  const goPrev = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIndex((i) => (i - 1 + visuals.length) % visuals.length);
  };
  const goNext = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIndex((i) => (i + 1) % visuals.length);
  };

  return (
    <Dialog>
      <div className="group relative h-full min-h-32 w-full overflow-hidden">
        <DialogTrigger
          render={
            <button
              type="button"
              className="block h-full w-full"
              aria-label="Ver imagem em tamanho maior"
            />
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- mídia dinâmica do R2, sem next/image config */}
          <img
            src={current.media_type === "gif" ? current.url : current.thumbnail_url ?? current.url}
            alt={poi.name}
            className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
          />
        </DialogTrigger>

        <span className="pointer-events-none absolute bottom-1 left-1 flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
          <CalendarDays className="size-3" />
          {registeredAt}
        </span>

        {visuals.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute top-1/2 left-1 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute top-1/2 right-1 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <div className="pointer-events-none absolute top-1 right-1 flex gap-1">
              {visuals.map((_, i) => (
                <span
                  key={i}
                  className={cn("size-1.5 rounded-full", i === index ? "bg-white" : "bg-white/40")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <DialogContent className="max-w-[calc(100%-2rem)] bg-transparent p-0 ring-0 sm:max-w-2xl">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- mídia dinâmica do R2, sem next/image config */}
          <img
            src={current.url}
            alt={poi.name}
            className="max-h-[80vh] w-full rounded-xl object-contain"
          />
          {visuals.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="size-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {visuals.map((_, i) => (
                  <span
                    key={i}
                    className={cn("size-1.5 rounded-full", i === index ? "bg-white" : "bg-white/40")}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.add({ title: "Não foi possível copiar", type: "error" });
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            onClick={copy}
            className="inline-flex shrink-0 items-center text-muted-foreground hover:text-foreground"
            aria-label={`Copiar ${label}`}
          />
        }
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copiado!" : `Copiar ${label}`}</TooltipContent>
    </Tooltip>
  );
}

function AudioTrackButton({ url, index }: { url: string; index: number }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const howlRef = useRef<Howl | null>(null);

  useEffect(() => {
    return () => {
      howlRef.current?.unload();
    };
  }, []);

  const toggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!howlRef.current) {
      const howl = new Howl({
        src: [url],
        onend: () => setIsPlaying(false),
        onload: () => setDuration(howl.duration()),
      });
      howlRef.current = howl;
    }
    if (isPlaying) {
      howlRef.current.pause();
      setIsPlaying(false);
    } else {
      howlRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2.5 rounded-lg border border-primary bg-transparent px-2.5 py-1.5 text-left transition-colors hover:bg-primary/10 active:scale-[0.99]"
    >
      {isPlaying ? (
        <Pause className="size-4 shrink-0 text-primary" />
      ) : (
        <Play className="size-4 shrink-0 text-primary" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-primary">Áudio {index + 1}</span>
        {duration != null && (
          <span className="text-[10px] text-primary/70">{formatDuration(duration)}</span>
        )}
      </span>
    </button>
  );
}

interface ReactionsBarProps {
  poi: Poi;
  currentUserId?: string | null;
  onReacted: () => void | Promise<void>;
}

function ReactionsBar({ poi, currentUserId, onReacted }: ReactionsBarProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const grouped = new Map<string, PoiReaction[]>();
  for (const reaction of poi.reactions) {
    const list = grouped.get(reaction.emoji) ?? [];
    list.push(reaction);
    grouped.set(reaction.emoji, list);
  }

  if (grouped.size === 0 && currentUserId == null) return null;

  const react = async (emoji: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setIsSubmitting(true);
    try {
      await fetch(`/api/pois/${poi.id}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      await onReacted();
    } finally {
      setIsSubmitting(false);
      setPickerOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from(grouped.entries()).map(([emoji, reactions]) => {
        const mine = currentUserId != null && reactions.some((r) => r.user_id === currentUserId);
        return (
          <Tooltip key={emoji}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(event) => react(emoji, event)}
                  disabled={isSubmitting || currentUserId == null}
                  className={cn(
                    "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs disabled:opacity-60",
                    mine
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border bg-muted text-foreground",
                  )}
                />
              }
            >
              <span>{emoji}</span>
              <span>{reactions.length}</span>
            </TooltipTrigger>
            <TooltipContent>
              {reactions.map((r) => r.user_name ?? "Alguém").join(", ")} reagiu com {emoji}
            </TooltipContent>
          </Tooltip>
        );
      })}

      {currentUserId != null && (
        <div className="relative">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setPickerOpen((open) => !open);
                  }}
                  className="flex size-6 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground"
                  aria-label="Reagir com emoji"
                />
              }
            >
              <SmilePlus className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Reagir</TooltipContent>
          </Tooltip>

          {pickerOpen && (
            <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-full border border-border bg-popover p-1 shadow-lg">
              {REACTION_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={(event) => react(emoji, event)}
                  disabled={isSubmitting}
                  className="flex size-6 items-center justify-center rounded-full text-sm hover:bg-muted disabled:opacity-60"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatCommentDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface CommentsSectionProps {
  poi: Poi;
  currentUserId?: string | null;
}

/** Seção de comentários (Fase 7 Parte 3) — mesmo padrão visual colapsável já
 * usado pro `addressSection` acima (fechado por padrão, pode ocupar bastante
 * espaço vertical). Busca roda independente do estado aberto/fechado pra já
 * mostrar a contagem no cabeçalho. */
function CommentsSection({ poi, currentUserId }: CommentsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [limit, setLimit] = useState(20);
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useComments(poi.id, limit);
  const comments = data?.items ?? [];
  const total = data?.total ?? 0;

  // Invalida todas as páginas (`limit` crescente) desse POI de uma vez —
  // `queryKey` parcial casa com qualquer `limit` já cacheado.
  const invalidateComments = () =>
    queryClient.invalidateQueries({ queryKey: ["comments", poi.id], exact: false });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (draft.trim().length === 0) return;
    setIsSubmitting(true);
    try {
      await createComment(poi.id, draft.trim());
      setDraft("");
      await invalidateComments();
    } catch (error) {
      toast.add({
        title: "Não foi possível publicar o comentário",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      await invalidateComments();
    } catch (error) {
      toast.add({
        title: "Não foi possível excluir o comentário",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen((open) => !open);
        }}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs text-muted-foreground"
      >
        <span className="flex items-center gap-1.5">
          <MessageCircle className="size-3.5" />
          Comentários{data ? ` (${total})` : ""}
        </span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div
          className="flex flex-col gap-2 border-t border-border/60 px-2.5 py-2"
          onClick={(event) => event.stopPropagation()}
        >
          {isLoading && <p className="text-xs text-muted-foreground">Carregando...</p>}

          {!isLoading && comments.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum comentário ainda{currentUserId != null ? " — seja o primeiro!" : "."}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {comments.map((comment, index) => {
              const canDelete =
                currentUserId != null &&
                (currentUserId === comment.user_id || currentUserId === poi.user_id);
              return (
                <MotionListItem key={comment.id} index={index}>
                  <div className="flex items-start gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                    {comment.user_avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- avatar dinâmico do R2/Google, sem next/image config
                      <img
                        src={comment.user_avatar_url}
                        alt=""
                        className="size-6 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <UserRound className="size-6 shrink-0 rounded-full border border-border p-1 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-foreground">
                          {comment.user_name ?? "Alguém"}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatCommentDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs break-words whitespace-pre-wrap text-foreground">
                        {comment.body}
                      </p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={(event) => handleDelete(comment.id, event)}
                        disabled={deletingId === comment.id}
                        className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        aria-label="Excluir comentário"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </MotionListItem>
              );
            })}
          </div>

          {comments.length < total && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setLimit((l) => l + 20);
              }}
              className="self-center text-[11px] font-medium text-primary hover:text-primary/80"
            >
              Carregar mais
            </button>
          )}

          {currentUserId != null && (
            <form onSubmit={handleSubmit} className="flex items-end gap-1.5 pt-1">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  // Enter envia, Shift+Enter quebra linha — comentário pode
                  // ter várias linhas (até 1000 caracteres).
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Escreva um comentário... (Enter envia, Shift+Enter quebra linha)"
                rows={1}
                maxLength={1000}
                className="min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <button
                type="submit"
                disabled={isSubmitting || draft.trim().length === 0}
                className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground disabled:opacity-50"
                aria-label="Enviar comentário"
              >
                {isSubmitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
