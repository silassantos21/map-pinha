"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useAvatarPresets } from "@/hooks/use-avatar-presets";
import { updateAvatarChoice } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AvatarPickerProps {
  currentAvatarChoiceUrl: string | null;
  onSaved?: () => void;
}

/** Galeria dos 20 avatares pré-gerados (Fase 9) — usada na tela de perfil e
 * no onboarding. Escolher um chama `PATCH /users/me/avatar` na hora (sem
 * botão "salvar" à parte, igual reagir com emoji ou favoritar um POI). */
export function AvatarPicker({ currentAvatarChoiceUrl, onSaved }: AvatarPickerProps) {
  const { data: presets = [], isLoading } = useAvatarPresets(true);
  const [pendingPresetId, setPendingPresetId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const queryClient = useQueryClient();

  const isBusy = pendingPresetId !== null || isClearing;

  const choosePreset = async (presetId: number) => {
    setPendingPresetId(presetId);
    try {
      await updateAvatarChoice(presetId);
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
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
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
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
