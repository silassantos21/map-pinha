"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MapPinPlus, Navigation, Sparkles, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";

const STORAGE_PREFIX = "mapinha-onboarding-seen:";
// Total de passos = 1 (escolher avatar) + os da tutorial abaixo.
const TOTAL_STEPS_OFFSET = 1;

const STEPS = [
  {
    icon: MapPinPlus,
    title: "Crie seus pontos de interesse",
    description:
      'Toque no botão "+" ou segure um lugar no mapa pra marcar um ponto — pode ser sua casa, um restaurante favorito ou aquele lugar secreto só seu.',
  },
  {
    icon: Sparkles,
    title: "Dê a cara dele",
    description:
      "Adicione fotos, GIFs e até um áudio no Marcador. A IA também pode sugerir categoria e escrever uma descrição divertida pra você.",
  },
  {
    icon: Navigation,
    title: "Trace rotas e explore",
    description:
      "Toque em um Marcador pra calcular a rota até lá, acompanhar a navegação em tempo real e trocar entre 4 temas visuais de mapa.",
  },
] as const;

interface OnboardingDialogProps {
  userId: string;
}

/** Tutorial interativo de 3 passos no primeiro login (Sprint 6) — guardado
 * em localStorage por `userId` (não existe um campo "já viu o onboarding"
 * no backend, e não precisa: é informação puramente de UI, sem valor em
 * sincronizar entre dispositivos). Abre com um pequeno atraso pra não
 * competir com o overlay de geolocalização logo na entrada. */
export function OnboardingDialog({ userId }: OnboardingDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const key = `${STORAGE_PREFIX}${userId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return; // localStorage indisponível (ex: aba privada bloqueando) — só não mostra, não quebra o app
    }
    const timeout = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timeout);
  }, [userId]);

  const finish = () => {
    setOpen(false);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, "1");
    } catch {
      // sem problema — só significa que o tutorial pode aparecer de novo na próxima visita
    }
  };

  // Passo 0 (novo): escolher avatar, antes do tutorial de 3 passos já
  // existente — reaproveita o mesmo seletor usado na tela de perfil
  // (`AvatarPicker`), chamado aqui porque é o "momento de criar a conta" na
  // prática: não existe formulário de cadastro próprio (login é só "Entrar
  // com Google"), este diálogo já é o primeiro contato com o app.
  const isAvatarStep = step === 0;
  const totalSteps = TOTAL_STEPS_OFFSET + STEPS.length;
  const isLast = step === totalSteps - 1;
  const { data: currentUser } = useCurrentUser(open);

  const current = isAvatarStep ? null : STEPS[step - TOTAL_STEPS_OFFSET];
  const Icon = current?.icon ?? UserRound;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish()}>
      <DialogContent showCloseButton={false} className="overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary/15">
              <Icon className="size-7 text-primary" />
            </span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <DialogTitle className="font-display text-base">
                {isAvatarStep ? "Escolha seu avatar" : current!.title}
              </DialogTitle>
              {isAvatarStep ? (
                <p className="text-sm text-muted-foreground">
                  Um dos 20 avatares prontos, ou pule e continue com sua foto do Google.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">{current!.description}</p>
              )}
            </motion.div>
          </AnimatePresence>
        </DialogHeader>

        {isAvatarStep && (
          <AvatarPicker currentAvatarChoiceUrl={currentUser?.avatar_choice_url ?? null} />
        )}

        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: totalSteps }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === step ? "w-5 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <DialogFooter className="!bg-transparent border-t-0">
          <Button variant="ghost" size="sm" onClick={finish}>
            Pular
          </Button>
          <Button
            size="sm"
            onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          >
            {isLast ? "Começar a explorar" : "Próximo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
