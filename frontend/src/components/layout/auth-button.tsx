import { auth, signIn } from "@/auth";
import { UserAvatarBadge } from "@/components/layout/user-avatar-badge";
import { Button } from "@/components/ui/button";
import { backendFetch } from "@/lib/api-server";
import type { CurrentUser } from "@/types/poi";

export async function AuthButton() {
  const session = await auth();

  if (session?.user) {
    // Busca o usuário já no servidor (direto no backend, sem o hop pela
    // própria rota /api/users/me) pra passar como `initialData` pro
    // `UserAvatarBadge` — sem isso, o avatar nascia com a foto do Google e só
    // trocava pro avatar escolhido quando o fetch do cliente terminava.
    let initialCurrentUser: CurrentUser | undefined;
    if (session.user.id) {
      try {
        const res = await backendFetch(`/api/v1/users/${session.user.id}`);
        if (res.ok) initialCurrentUser = await res.json();
      } catch {
        // sem initialData — UserAvatarBadge cai pro fetch normal no cliente
      }
    }

    return (
      <UserAvatarBadge
        userName={session.user.name}
        googleAvatarUrl={session.user.image}
        initialCurrentUser={initialCurrentUser}
      />
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button type="submit" size="sm" className="rounded-full">
        Entrar
      </Button>
    </form>
  );
}
