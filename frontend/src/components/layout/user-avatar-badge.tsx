"use client";

import { UserRound } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/hooks/use-current-user";

interface UserAvatarBadgeProps {
  userName?: string | null;
  googleAvatarUrl?: string | null;
}

/** Avatar + primeiro nome empilhados no canto superior direito do HUD (Fase 9)
 * — substitui o antigo botão de texto puro do `AuthButton`. Usa
 * `useCurrentUser` pra refletir a escolha de avatar na hora (o
 * `session.user.image` do NextAuth só é atualizado no login, não quando o
 * usuário troca o avatar no perfil). O próprio botão continua sendo o
 * submit do form de logout em `auth-button.tsx`. */
export function UserAvatarBadge({ userName, googleAvatarUrl }: UserAvatarBadgeProps) {
  const { data: currentUser } = useCurrentUser(true);
  const avatarUrl = currentUser?.avatar_choice_url ?? googleAvatarUrl;
  const firstName = userName?.split(" ")[0] ?? "Sair";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="submit"
            className="pointer-events-auto flex flex-col items-center gap-1 transition-transform active:scale-95"
            aria-label="Sair da conta"
          />
        }
      >
        <span className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-card shadow-lg ring-2 ring-background">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar vem do Google ou do R2, hosts externos sem domínio fixo configurado em next.config.mjs
            <img src={avatarUrl} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserRound className="size-4 text-muted-foreground" />
          )}
        </span>
        <span className="rounded-full border border-border bg-card/80 px-2.5 py-0.5 text-[0.7rem] font-medium text-foreground shadow-sm backdrop-blur-md">
          {firstName}
        </span>
      </TooltipTrigger>
      <TooltipContent side="left">Sair</TooltipContent>
    </Tooltip>
  );
}
