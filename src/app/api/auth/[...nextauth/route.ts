import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";
import { login } from "@src/services/auth/login";
import { getUserProfile } from "@src/services/user/me";
import type { UserRoles, TokenClaims } from "@src/interfaces/auth/tokenClaims";

const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? "dev-secret-solo-para-local";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const { email, password } = credentials as { email: string; password: string };

        // 1) Login backend
        const { token } = await login({ email, password });

        // 2) Perfil (no imprescindible)
        let profile: any = null;
        try { profile = await getUserProfile(token); } catch {}

        // 3) Claims
        let role: UserRoles = "CLIENTE";
        try {
          const claims = jwtDecode<TokenClaims>(token);
          role = (claims.role as UserRoles) || (claims as any)?.rol || "CLIENTE";
        } catch {}

        return {
          id: profile?.id || email,
          email: profile?.email || email,
          firstName: profile?.firstName || (role === "ADMIN" ? "Admin" : ""),
          lastName: profile?.lastName || "",
          role,
          accessToken: token,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: (token.id as string) || "",
        email: (token.email as string) || "",
        firstName: (token.firstName as string) || "",
        lastName: (token.lastName as string) || "",
        role:
          ((token.role as string) as UserRoles) ??
          "CLIENTE",
      } as any;
      (session as any).accessToken = (token.accessToken as string) || "";
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    newUser: "/auth/register",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24,
    updateAge: 60 * 60 * 24 * 30,
  },
  trustHost: true,
  secret: NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
