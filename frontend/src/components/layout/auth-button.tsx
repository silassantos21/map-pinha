import { auth, signIn, signOut } from "@/auth";
import { UserAvatarBadge } from "@/components/layout/user-avatar-badge";
import { Button } from "@/components/ui/button";

export async function AuthButton() {
  const session = await auth();

  if (session?.user) {
    return (
      <form
        action={async () => {
          "use server";
          await signOut();
        }}
      >
        <UserAvatarBadge userName={session.user.name} googleAvatarUrl={session.user.image} />
      </form>
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
