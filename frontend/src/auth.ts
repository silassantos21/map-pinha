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
        });

        if (res.ok) {
          const backendUser = (await res.json()) as { id: string };
          token.userId = backendUser.id;
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
