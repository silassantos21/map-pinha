"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { Loader2, LocateFixed, Search, Signpost, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { MediaUploader, type PendingMedia } from "@/components/poi/media-uploader";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { useCategories } from "@/hooks/use-categories";
import { useMyGroups } from "@/hooks/use-groups";
import { usePoi } from "@/hooks/use-poi";
import { generatePoiBio, searchAddresses } from "@/lib/api-client";
import { ICON_PICKER_OPTIONS, resolveIconName } from "@/lib/poi-icons";
import { poiFormSchema, type PoiFormValues } from "@/lib/poi-schema";
import { attachMediaToPoi, uploadMediaFile } from "@/lib/upload-media";
import { useMapStore } from "@/stores/map-store";
import type { AddressResult, PoiMedia } from "@/types/poi";

const EMPTY_FORM_VALUES: PoiFormValues = {
  name: "",
  description: "",
  address: "",
  categoryId: "",
  visibility: "public",
  groupId: null,
};

interface PoiFormSheetProps {
  userId?: string | null;
}

export function PoiFormSheet({ userId }: PoiFormSheetProps) {
  const isCreatingPoi = useMapStore((s) => s.isCreatingPoi);
  const cancelCreatingPoi = useMapStore((s) => s.cancelCreatingPoi);
  const draftPosition = useMapStore((s) => s.draftPoiPosition);
  const editingPoiId = useMapStore((s) => s.editingPoiId);
  const setDraftPoiPosition = useMapStore((s) => s.setDraftPoiPosition);
  const stopEditingPoi = useMapStore((s) => s.stopEditingPoi);
  const mapBounds = useMapStore((s) => s.mapBounds);

  const isEditMode = editingPoiId !== null;
  const isOpen = isCreatingPoi || isEditMode;
  // Sheet lateral (w-3/4 da tela) deixa pouco espaço de mapa visível pra
  // marcar a posição no celular — abre de baixo pra cima no mobile, mantendo
  // metade da tela sempre tocável (ver `max-h` abaixo, reduzido de 65vh pra
  // 50vh a pedido do dono do projeto — o formulário tomava espaço demais do
  // mapa), e continua lateral a partir do breakpoint `sm` do Tailwind
  // (640px), onde o espaço já sobra.
  const isMobile = useMediaQuery("(max-width: 639px)");
  const { data: editingPoi } = usePoi(editingPoiId, userId);
  const { data: categories } = useCategories();
  const queryClient = useQueryClient();

  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<PoiMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [removingMediaId, setRemovingMediaId] = useState<string | null>(null);

  const [iconName, setIconName] = useState<string | null>(null);

  const [positionInputMode, setPositionInputMode] = useState<"address" | "latlng">("address");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [positionError, setPositionError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    control,
    formState: { errors },
  } = useForm<PoiFormValues>({
    resolver: zodResolver(poiFormSchema),
    defaultValues: EMPTY_FORM_VALUES,
  });

  const [isGeneratingBio, setIsGeneratingBio] = useState(false);

  // Seletor de ícone livre só faz sentido na categoria "outros" — as demais
  // já têm ícone fixo próprio.
  const selectedCategoryId = useWatch({ control, name: "categoryId" });
  const isOutrosCategory =
    categories?.find((c) => c.id === selectedCategoryId)?.slug === "outros";

  // Seletor de grupo só aparece quando a visibilidade escolhida é "group".
  const selectedVisibility = useWatch({ control, name: "visibility" });
  const { data: myGroups } = useMyGroups(userId != null && selectedVisibility === "group");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- limpa o ícone livre escolhido quando sai da categoria "outros", intencional
    if (!isOutrosCategory) setIconName(null);
  }, [isOutrosCategory]);

  // Auto-preenche o endereço (geocodificação reversa) toda vez que a posição
  // do pino muda — clique no mapa, arrastar o marcador ou aplicar lat/lng.
  // Isso sobrescreve de propósito um endereço digitado à mão: um reposicionamento
  // é a ação mais explícita possível de "é aqui", então o endereço deve seguir o pino.
  useEffect(() => {
    if (!draftPosition) return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(
          `/api/geocode/reverse?lat=${draftPosition.lat}&lng=${draftPosition.lng}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data: { address: string | null } = await res.json();
        if (data.address) {
          setValue("address", data.address, { shouldDirty: true });
        }
      } catch {
        // autofill é um bônus — falha silenciosa, o usuário sempre pode digitar manualmente
      }
    })();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftPosition?.lat, draftPosition?.lng, setValue]);

  useEffect(() => {
    if (isEditMode && editingPoi) {
      reset({
        name: editingPoi.name,
        description: editingPoi.description ?? "",
        address: editingPoi.address ?? "",
        categoryId: editingPoi.category_id,
        visibility: editingPoi.visibility,
        groupId: editingPoi.group_id,
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza estado local com o POI carregado ao entrar em modo de edição
      setIconName(editingPoi.icon_name);
      setExistingMedia(editingPoi.media);
    }
  }, [isEditMode, editingPoi, reset]);

  // Fecha o formulário por qualquer via: botão "X" do HUD (muda o estado do
  // store direto, sem passar pelo onOpenChange da Sheet), botão de fechar da
  // própria Sheet, ESC, clique fora, ou após salvar com sucesso. Centralizado
  // num efeito pra garantir que o reset do estado local sempre acontece.
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    if (wasOpenRef.current && !isOpen) {
      setPendingMedia([]);
      setExistingMedia([]);
      setSubmitError(null);
      setIconName(null);
      setPositionInputMode("address");
      setAddressQuery("");
      setAddressResults([]);
      setLatInput("");
      setLngInput("");
      setPositionError(null);
      reset(EMPTY_FORM_VALUES);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, reset]);

  const close = () => {
    cancelCreatingPoi();
    stopEditingPoi();
  };

  const removeExistingMedia = async (media: PoiMedia) => {
    if (!editingPoiId) return;
    setRemovingMediaId(media.id);
    try {
      const res = await fetch(`/api/pois/${editingPoiId}/media/${media.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Falha ao remover a mídia");
      setExistingMedia((items) => items.filter((item) => item.id !== media.id));
      await queryClient.invalidateQueries({ queryKey: ["poi", editingPoiId] });
      await queryClient.invalidateQueries({ queryKey: ["pois"] });
      toast.add({ title: "Mídia removida", type: "success" });
    } catch (error) {
      toast.add({
        title: "Não foi possível remover a mídia",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setRemovingMediaId(null);
    }
  };

  const selectAddressResult = (result: AddressResult) => {
    setDraftPoiPosition({ lat: result.lat, lng: result.lng });
    setValue("address", result.address, { shouldDirty: true });
    setAddressResults([]);
  };

  const searchByAddress = async () => {
    if (addressQuery.trim().length < 3) {
      setPositionError("Digite pelo menos 3 caracteres do endereço");
      return;
    }
    setIsGeocoding(true);
    setPositionError(null);
    setAddressResults([]);
    try {
      const results = await searchAddresses(addressQuery, mapBounds);
      if (results.length === 0) {
        setPositionError("Endereço não encontrado");
        return;
      }
      // Com só 1 opção não há ambiguidade — marca direto. Com mais de uma,
      // o app não tem como saber qual é a certa (ex: numeração imprecisa
      // do Nominatim); melhor mostrar as opções do que adivinhar e marcar
      // o lugar errado em silêncio.
      if (results.length === 1) {
        selectAddressResult(results[0]);
        return;
      }
      setAddressResults(results);
    } catch {
      setPositionError("Falha ao buscar o endereço");
    } finally {
      setIsGeocoding(false);
    }
  };

  const applyLatLng = () => {
    const lat = parseFloat(latInput.replace(",", "."));
    const lng = parseFloat(lngInput.replace(",", "."));
    if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setPositionError("Latitude/longitude inválidas");
      return;
    }
    setPositionError(null);
    setDraftPoiPosition({ lat, lng });
  };

  // POIBioWriterAgent (Sprint 5) — gera uma descrição curta a partir do nome,
  // categoria e endereço já preenchidos no formulário.
  const generateBio = async () => {
    const name = getValues("name");
    const categoryName = categories?.find((c) => c.id === selectedCategoryId)?.name;
    if (!name || !categoryName) {
      toast.add({ title: "Preencha nome e categoria antes de gerar a descrição", type: "error" });
      return;
    }
    setIsGeneratingBio(true);
    try {
      const bio = await generatePoiBio({ name, categoryName, address: getValues("address") });
      setValue("description", bio, { shouldDirty: true });
    } catch (error) {
      toast.add({
        title: "Não foi possível gerar a descrição",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const onSubmit = async (values: PoiFormValues) => {
    if (!draftPosition) {
      setSubmitError("Marque a posição no mapa, por endereço ou por coordenadas antes de salvar.");
      return;
    }
    if (pendingMedia.length === 0 && existingMedia.length === 0) {
      setSubmitError("Adicione pelo menos uma imagem, GIF ou áudio antes de salvar.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        name: values.name,
        description: values.description || null,
        address: values.address || null,
        category_id: values.categoryId,
        lat: draftPosition.lat,
        lng: draftPosition.lng,
        visibility: values.visibility,
        group_id: values.visibility === "group" ? values.groupId : null,
        icon_name: isOutrosCategory ? iconName : null,
      };

      let poiId: string;
      if (isEditMode) {
        poiId = editingPoiId as string;
        const res = await fetch(`/api/pois/${poiId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Falha ao salvar as alterações");
      } else {
        const res = await fetch("/api/pois", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Falha ao criar o Marcador");
        const created: { id: string } = await res.json();
        poiId = created.id;
      }

      try {
        for (const item of pendingMedia) {
          const { objectKey } = await uploadMediaFile(
            item.file,
            item.filename,
            item.contentType,
            item.mediaType,
          );
          await attachMediaToPoi(poiId, objectKey, item.mediaType);
        }
      } catch (mediaError) {
        // O POI (campos de texto) já foi criado com sucesso acima — sem
        // isso, uma falha de upload (ex: CORS mal configurado no R2, como
        // aconteceu de verdade em produção) deixa um POI órfão sem mídia, e
        // quem tenta de novo acaba criando um duplicado. Desfaz o POI recém
        // criado só nesse caso (nunca em modo de edição, onde o POI já
        // existia antes dessa chamada) antes de propagar o erro original.
        if (!isEditMode) {
          await fetch(`/api/pois/${poiId}`, { method: "DELETE" }).catch(() => {});
        }
        throw mediaError;
      }

      await queryClient.invalidateQueries({ queryKey: ["pois"] });
      await queryClient.invalidateQueries({ queryKey: ["my-pois"] });
      if (isEditMode) await queryClient.invalidateQueries({ queryKey: ["poi", poiId] });
      toast.add({
        title: isEditMode ? "Marcador atualizado" : "Marcador criado",
        description: values.name,
        type: "success",
      });
      close();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro inesperado ao salvar";
      setSubmitError(message);
      toast.add({ title: "Não foi possível salvar", description: message, type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      // Não-modal: o usuário precisa continuar clicando/arrastando no mapa
      // (atrás da Sheet) pra marcar a posição enquanto o formulário está
      // aberto. `disablePointerDismissal` evita que esse clique no mapa seja
      // interpretado como "clique fora" e feche o formulário sozinho.
      modal={false}
      disablePointerDismissal
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn("flex flex-col", isMobile && "max-h-[50vh]")}
        showOverlay={false}
      >
        <SheetHeader>
          <SheetTitle className="font-display">{isEditMode ? "Editar Marcador" : "Novo Marcador"}</SheetTitle>
          <SheetDescription>
            {draftPosition
              ? "O pino tracejado roxo no mapa (atrás desta janela) marca a posição — arraste-o para ajustar, ou use a busca abaixo."
              : "Clique em qualquer ponto do mapa pra marcar a posição, ou use a busca por endereço/coordenadas abaixo."}
          </SheetDescription>
        </SheetHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-1 flex-col gap-3 overflow-y-auto px-4"
        >
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="text-xs font-medium text-foreground">Ajustar posição</p>
            <p className="text-[10px] text-muted-foreground">
              Clique no mapa pra marcar a posição, ou escolha abaixo buscar por endereço ou
              informar lat/lng diretamente — os dois podem apontar pra lugares diferentes, então
              use só um por vez.
            </p>

            <div className="flex gap-1 rounded-md bg-background p-0.5">
              <button
                type="button"
                onClick={() => setPositionInputMode("address")}
                className={cn(
                  "flex-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors",
                  positionInputMode === "address"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Endereço
              </button>
              <button
                type="button"
                onClick={() => setPositionInputMode("latlng")}
                className={cn(
                  "flex-1 rounded-sm px-2 py-1 text-[11px] font-medium transition-colors",
                  positionInputMode === "latlng"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Latitude/Longitude
              </button>
            </div>

            {positionInputMode === "address" ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={addressQuery}
                  onChange={(event) => setAddressQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      searchByAddress();
                    }
                  }}
                  placeholder="Buscar por endereço..."
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={searchByAddress}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Search className="size-3.5" />
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={latInput}
                  onChange={(event) => setLatInput(event.target.value)}
                  placeholder="Latitude"
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={lngInput}
                  onChange={(event) => setLngInput(event.target.value)}
                  placeholder="Longitude"
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyLatLng}
                  aria-label="Aplicar coordenadas"
                >
                  <LocateFixed className="size-3.5" />
                </Button>
              </div>
            )}

            {addressResults.length > 0 && (
              <div className="flex flex-col gap-0.5 rounded-md border border-border bg-background p-1">
                <p className="px-1.5 pt-0.5 text-[10px] text-muted-foreground">
                  {addressResults.length} opções encontradas — toque na certa:
                </p>
                {addressResults.map((result, index) => (
                  <button
                    key={`${result.lat},${result.lng},${index}`}
                    type="button"
                    onClick={() => selectAddressResult(result)}
                    className="flex items-start gap-1.5 rounded-sm px-1.5 py-1.5 text-left hover:bg-muted"
                  >
                    <Signpost className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs text-foreground">{result.address}</span>
                  </button>
                ))}
              </div>
            )}

            {positionError && <p className="text-xs text-destructive">{positionError}</p>}
            {draftPosition ? (
              <p className="text-[10px] text-muted-foreground">
                Posição atual: {draftPosition.lat.toFixed(5)}, {draftPosition.lng.toFixed(5)}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground">Nenhuma posição marcada ainda.</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="poi-name" className="text-xs font-medium text-foreground">
              Nome
            </label>
            <input
              id="poi-name"
              {...register("name")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="poi-category" className="text-xs font-medium text-foreground">
              Categoria
            </label>
            <select
              id="poi-category"
              {...register("categoryId")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Selecione...</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.categoryId && (
              <p className="text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>

          {isOutrosCategory && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-foreground">Ícone</p>
              <div className="grid grid-cols-6 gap-1.5 rounded-lg border border-border bg-muted/30 p-2">
                {ICON_PICKER_OPTIONS.map((option) => {
                  const Icon = resolveIconName(option.name);
                  const selected = iconName === option.name;
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setIconName(option.name)}
                      title={option.label}
                      aria-label={option.label}
                      className={cn(
                        "flex size-9 items-center justify-center rounded-md border transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label htmlFor="poi-description" className="text-xs font-medium text-foreground">
                Descrição
              </label>
              <button
                type="button"
                onClick={generateBio}
                disabled={isGeneratingBio}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {isGeneratingBio ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Sparkles className="size-3" />
                )}
                Gerar com IA
              </button>
            </div>
            <textarea
              id="poi-description"
              rows={3}
              {...register("description")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="poi-address" className="text-xs font-medium text-foreground">
              Endereço
            </label>
            <input
              id="poi-address"
              {...register("address")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="poi-visibility" className="text-xs font-medium text-foreground">
              Quem pode ver
            </label>
            <select
              id="poi-visibility"
              {...register("visibility")}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="public">Público (qualquer pessoa no mapa)</option>
              <option value="followers">Seguidores</option>
              <option value="group">Grupo específico</option>
              <option value="private">Só eu</option>
            </select>
          </div>

          {selectedVisibility === "group" && (
            <div className="flex flex-col gap-1">
              <label htmlFor="poi-group" className="text-xs font-medium text-foreground">
                Qual grupo
              </label>
              <Controller
                control={control}
                name="groupId"
                render={({ field }) => (
                  // Controlado (em vez de `register` uncontrolled) — as opções
                  // só chegam depois de um fetch assíncrono (`useMyGroups`),
                  // e em modo de edição o valor inicial vem de um `reset()`
                  // que roda antes deste `<select>` existir no DOM; um select
                  // uncontrolled não reaplica esse valor quando o elemento
                  // aparece depois, então ele ficava sempre "Selecione um
                  // grupo..." mesmo com um grupo já escolhido/salvo.
                  <select
                    id="poi-group"
                    value={field.value ?? ""}
                    onChange={(event) => field.onChange(event.target.value || null)}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  >
                    <option value="">Selecione um grupo...</option>
                    {myGroups?.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {myGroups?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Você ainda não faz parte de nenhum grupo — crie um no painel &quot;Social&quot;.
                </p>
              )}
              {errors.groupId && (
                <p className="text-xs text-destructive">{errors.groupId.message}</p>
              )}
            </div>
          )}

          {existingMedia.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-foreground">Mídia atual</p>
              <ul className="flex flex-col gap-1.5">
                {existingMedia.map((media) => {
                  const isRemoving = removingMediaId === media.id;
                  return (
                    <li
                      key={media.id}
                      className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                    >
                      {media.media_type === "image" || media.media_type === "gif" ? (
                        // eslint-disable-next-line @next/next/no-img-element -- mídia dinâmica do R2, sem next/image config
                        <img
                          src={media.media_type === "gif" ? media.url : media.thumbnail_url ?? media.url}
                          alt=""
                          className="size-9 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <audio src={media.url} controls className="h-8 w-36 shrink-0" />
                      )}
                      <span className="min-w-0 flex-1 truncate text-foreground">
                        {media.media_type} — {media.url.split("/").pop()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExistingMedia(media)}
                        disabled={isRemoving}
                        className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        aria-label="Remover mídia"
                      >
                        {isRemoving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">
              {isEditMode ? "Adicionar mídia" : "Mídia (imagem, GIF, áudio)"}
            </p>
            <MediaUploader value={pendingMedia} onChange={setPendingMedia} />
          </div>

          {submitError && <p className="text-xs text-destructive">{submitError}</p>}

          <SheetFooter>
            <Button type="submit" variant="accent" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : isEditMode ? "Salvar alterações" : "Salvar Marcador"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
