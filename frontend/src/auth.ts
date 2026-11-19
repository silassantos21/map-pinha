import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.googleId = account.providerAccountId;
      }

      // Tenta sincronizar no login inicial E, pra se autocurar, em qualquer
      // renovação seguinte enquanto `userId` ainda não tiver sido obtido —
      // cobre o caso real (17/11/2026, dois usuários de teste) em que o
      // backend (Render Free) "dorme" sem tráfego e pode levar até ~50s pra
      // acordar; o timeout abaixo é menor que isso, então a 1ª tentativa no
      // login pode falhar, mas sem o retry a sessão ficava "quebrada" pra
      // sempre (sem `userId`, incapaz de criar Marcador e nem aparecer na
      // busca de usuários) até a pessoa deslogar e logar de novo — agora a
      // próxima requisição tenta de novo, e o backend já estará acordado.
      if ((account || !token.userId) && token.googleId) {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 20_000);
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Secret": process.env.INTERNAL_API_SECRET ?? "",
            },
            body: JSON.stringify({
              email: token.email,
              name: token.name,
              avatar_url: token.picture,
              google_id: token.googleId,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            const backendUser = (await res.json()) as { id: string };
            token.userId = backendUser.id;
          }
        } catch (error) {
          // Degradação suave: login/sessão seguem valendo sem `userId` por
          // enquanto — a própria condição acima tenta de novo na próxima vez.
          console.error("Falha ao sincronizar usuário com o backend", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
