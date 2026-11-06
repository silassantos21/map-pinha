"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAvatarPresets } from "@/hooks/use-avatar-presets";
import { updateAvatarChoice, uploadCustomAvatar } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Mesmo limite de 5 MB do backend — checagem aqui é só feedback rápido pro
// usuário, não é a validação de verdade (essa só acontece no servidor,
// depois que o arquivo já chegou no storage: ver `process_avatar_upload`).
const MAX_AVATAR_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface AvatarPickerProps {
  currentAvatarChoiceUrl: string | null;
  onSaved?: () => void;
}

/** Galeria dos 20 avatares pré-gerados (Fase 9) + envio de foto própria.
 * Usada na tela de perfil e no onboarding. Escolher um preset chama
 * `PATCH /users/me/avatar` na hora (sem botão "salvar" à parte, igual reagir
 * com emoji ou favoritar um POI); enviar uma foto própria passa primeiro por
 * uma URL pré-assinada + upload direto pro R2 (mesmo padrão de mídia de POI,
 * `upload-media.ts`), só então confirmada — a validação de verdade (tamanho,
 * se é mesmo uma imagem decodificável) acontece no servidor, não aqui. */
export function AvatarPicker({ currentAvatarChoiceUrl, onSaved }: AvatarPickerProps) {
  const { data: presets = [], isLoading } = useAvatarPresets(true);
  const [pendingPresetId, setPendingPresetId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const isBusy = pendingPresetId !== null || isClearing || isUploading;

  // O avatar não vive só no usuário: cada POI guarda uma cópia do avatar do
  // dono (`owner_avatar_url`) pra não precisar de join extra ao listar —
  // trocar de avatar sem invalidar essas listas deixava o marcador do mapa,
  // "Meus POIs" e "Favoritos" com a foto antiga até um refetch acontecer por
  // outro motivo (clicar em algo, recarregar a página).
  const invalidateAvatarDependentQueries = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["current-user"] }),
      queryClient.invalidateQueries({ queryKey: ["pois"] }),
      queryClient.invalidateQueries({ queryKey: ["my-pois"] }),
      queryClient.invalidateQueries({ queryKey: ["favorites"] }),
    ]);

  const handleFileSelected = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.add({ title: "Formato não permitido — use JPG, PNG ou WEBP", type: "error" });
      return;
    }
    if (file.size > MAX_AVATAR_FILE_BYTES) {
      toast.add({ title: "Arquivo maior que 5 MB", type: "error" });
      return;
    }

    setIsUploading(true);
    try {
      await uploadCustomAvatar(file);
      await invalidateAvatarDependentQueries();
      toast.add({ title: "Foto de perfil atualizada", type: "success" });
      onSaved?.();
    } catch (error) {
      toast.add({
        title: "Não foi possível enviar a foto",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const choosePreset = async (presetId: number) => {
    setPendingPresetId(presetId);
    try {
      await updateAvatarChoice(presetId);
      await invalidateAvatarDependentQueries();
      toast.add({ title: "Avatar atualizado", type: "success" });
      onSaved?.();
    } catch (error) {
      toast.add({
        title: "Não foi possível atualizar o avatar",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setPendingPresetId(null);
    }
  };

  const clearChoice = async () => {
    setIsClearing(true);
    try {
      await updateAvatarChoice(null);
      await invalidateAvatarDependentQueries();
      toast.add({ title: "Voltou pra foto do Google", type: "success" });
      onSaved?.();
    } catch (error) {
      toast.add({
        title: "Não foi possível atualizar o avatar",
        description: error instanceof Error ? error.message : undefined,
        type: "error",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 p-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => handleFileSelected(event.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="shrink-0"
        >
          {isUploading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          {isUploading ? "Enviando..." : "Enviar minha foto"}
        </Button>
        <p className="text-[11px] text-muted-foreground">JPG, PNG ou WEBP, até 5 MB.</p>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => {
          const isSelected = currentAvatarChoiceUrl === preset.url;
          const isSavingThis = pendingPresetId === preset.preset_id;
          return (
            <button
              key={preset.preset_id}
              type="button"
              onClick={() => choosePreset(preset.preset_id)}
              disabled={isBusy}
              className={cn(
                "relative aspect-square overflow-hidden rounded-full border-2 transition-colors disabled:opacity-60",
                isSelected ? "border-primary" : "border-transparent hover:border-border",
              )}
              aria-label={`Escolher avatar ${preset.preset_id}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- avatar vem do R2, sem domínio fixo configurado em next.config.mjs */}
              <img
                src={preset.url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {isSelected && !isSavingThis && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Check className="size-4 text-white" />
                </span>
              )}
              {isSavingThis && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="size-4 animate-spin text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {currentAvatarChoiceUrl && (
        <Button variant="outline" size="sm" onClick={clearChoice} disabled={isBusy}>
          {isClearing ? "Removendo..." : "Usar foto do Google"}
        </Button>
      )}
    </div>
  );
}
