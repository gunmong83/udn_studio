import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import { prisma } from "@/src/lib/prisma";

const adminEmail = "gunmong83@gmail.com";
const providers = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    : null,
  process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET
    ? Naver({ clientId: process.env.AUTH_NAVER_ID, clientSecret: process.env.AUTH_NAVER_SECRET })
    : null,
].filter((provider): provider is NonNullable<typeof provider> => provider !== null);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  trustHost: true,
  callbacks: {
    async session({ session }) {
      if (session.user?.email) {
        session.user.role = session.user.email.toLowerCase() === adminEmail ? "admin" : "customer";
      }
      return session;
    },
  },
});
