import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword } from "@/src/lib/password";
import { isAdminEmail } from "@/src/lib/admin";

const providers = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    : null,
  process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET
    ? Naver({ clientId: process.env.AUTH_NAVER_ID, clientSecret: process.env.AUTH_NAVER_SECRET })
    : null,
  Credentials({
    credentials: {
      email: { label: "이메일", type: "email" },
      password: { label: "비밀번호", type: "password" },
    },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) return null;
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
].filter((provider): provider is NonNullable<typeof provider> => provider !== null);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  trustHost: true,
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }
      // PrismaAdapter의 내부 User.id를 JWT에 유지합니다. 이메일은 연락처일 뿐
      // 계정 식별자로 사용하지 않습니다.
      if (!token.id && token.sub) {
        token.id = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : typeof token.sub === "string" ? token.sub : "";
        if (session.user.email) {
          session.user.role = isAdminEmail(session.user.email) ? "admin" : "customer";
        }
      }
      return session;
    },
  },
});
