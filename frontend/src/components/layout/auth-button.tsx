import { auth, signIn, signOut } from "@/auth";
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
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          className="rounded-full"
        >
          {session.user.name?.split(" ")[0] ?? "Sair"}
        </Button>
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
