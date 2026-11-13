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
      // Só roda no login inicial (account só vem preenchido nesse momento),
      // não em toda renovação de token.
      if (account) {
        try {
          // O backend (Render Free) "dorme" sem tráfego e pode levar até ~50s
          // pra acordar na primeira requisição (documentado em SPRINTS.md) —
          // sem abortar antes do limite da função na Vercel, um cold start
          // derrubava o login inteiro com a tela genérica de erro do NextAuth
          // (achado real, 13/11/2026, numa conta nova logando pela 1ª vez).
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
              google_id: account.providerAccountId,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (res.ok) {
            const backendUser = (await res.json()) as { id: string };
            token.userId = backendUser.id;
          }
        } catch (error) {
          // Mesma degradação suave que já existia pro caso de `res.ok` falso
          // (login completa sem `userId` na sessão) — só agora também cobre
          // timeout/erro de rede, em vez de deixar a exceção derrubar o
          // login inteiro. Na prática, um próximo login tenta sincronizar de
          // novo (o backend já estará "acordado").
          console.error("Falha ao sincronizar usuário com o backend no login", error);
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
