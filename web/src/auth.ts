import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import { verifyPassword } from "@/src/lib/password";
import { ADMIN_EMAIL } from "@/src/lib/admin";
import { randomBytes } from "node:crypto";
import { AUTH_SESSION_COOKIE, authSessionCookieOptions } from "@/src/lib/auth-session";
import { allowLoginAttempt, clearLoginFailures, clientIp, recordFailedLogin } from "@/src/lib/request-rate-limit";

import { parseUserAgent } from "@/src/lib/user-agent";

async function recordLoginAudit(params: {
  email: string;
  userId?: string | null;
  provider: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED";
  failReason?: string | null;
  headers?: Headers | null;
}) {
  try {
    const rawHeaders = params.headers;
    const ip = rawHeaders ? clientIp(rawHeaders) : undefined;
    const country = rawHeaders?.get("cf-ipcountry") || undefined;
    const userAgent = rawHeaders?.get("user-agent") || undefined;
    const { device, browser, os } = parseUserAgent(userAgent || "");

    await prisma.loginAuditLog.create({
      data: {
        email: params.email.toLowerCase().trim(),
        userId: params.userId,
        provider: params.provider,
        status: params.status,
        failReason: params.failReason,
        ip,
        country,
        userAgent: userAgent ? userAgent.slice(0, 500) : undefined,
        device,
        browser,
        os,
      },
    });
  } catch (err) {
    console.error("[login-audit] record failed", { errorCode: err instanceof Error ? err.name : "unknown" });
  }
}

const providers = [
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
    ? Google({ clientId: process.env.AUTH_GOOGLE_ID, clientSecret: process.env.AUTH_GOOGLE_SECRET })
    : null,
  process.env.AUTH_NAVER_ID && process.env.AUTH_NAVER_SECRET
    ? Naver({
        clientId: process.env.AUTH_NAVER_ID,
        clientSecret: process.env.AUTH_NAVER_SECRET,
        // Ask Naver for the login/profile consent scope so first-time users
        // see Naver's account and personal-information consent screen.
        authorization: {
          url: "https://nid.naver.com/oauth2.0/authorize",
          params: { scope: "login userinfo" },
        },
      })
    : null,
  Credentials({
    credentials: {
      email: { label: "이메일", type: "email" },
      password: { label: "비밀번호", type: "password" },
    },
    async authorize(credentials, request) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const ip = clientIp(request.headers);
      try {
        if (!(await allowLoginAttempt(email, ip))) {
          recordLoginAudit({ email, provider: "credentials", status: "BLOCKED", failReason: "RATE_LIMITED", headers: request.headers });
          return null;
        }
      } catch (error) {
        console.error("[auth] login rate-limit lookup failed", { errorCode: error instanceof Error ? error.name : "unknown" });
        return null;
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
        await recordFailedLogin(email, ip).catch((error) => console.error("[auth] login failure recording failed", { errorCode: error instanceof Error ? error.name : "unknown" }));
        recordLoginAudit({
          email,
          provider: "credentials",
          status: "FAILED",
          failReason: !user ? "USER_NOT_FOUND" : "INVALID_PASSWORD",
          headers: request.headers,
        });
        return null;
      }
      await clearLoginFailures(email, ip).catch((error) => console.error("[auth] login failure clearing failed", { errorCode: error instanceof Error ? error.name : "unknown" }));
      recordLoginAudit({
        email,
        userId: user.id,
        provider: "credentials",
        status: "SUCCESS",
        headers: request.headers,
      });
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
].filter((provider): provider is NonNullable<typeof provider> => provider !== null);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: { name: AUTH_SESSION_COOKIE, options: authSessionCookieOptions },
  },
  trustHost: true,
  events: {
    // The configured administrator address is only used to seed the role when
    // that reserved account is first created. Runtime authorization always
    // uses User.role + the canonical internal User.id.
    async createUser({ user }) {
      const agreedAt = new Date();
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(user.email?.trim().toLowerCase() === ADMIN_EMAIL ? { role: "ADMIN" } : {}),
          termsAgreedAt: agreedAt,
          privacyAgreedAt: agreedAt,
        },
      });
    },
  },
  callbacks: {
    async signIn({ account, user }) {
      if (!account) return true;
      const provider = account?.provider;
      if (provider !== "google" && provider !== "naver") return true;

      // Existing provider identities log in immediately. For new identities,
      // retain the OAuth result for ten minutes and show Studio UDN's consent
      // page once; after acceptance it creates the account without a second
      // provider round trip.
      const existingAccount = await prisma.account.findFirst({
        where: { provider, providerAccountId: account.providerAccountId },
        select: { id: true, userId: true },
      });
      if (existingAccount) {
        recordLoginAudit({
          email: user.email || "",
          userId: existingAccount.userId,
          provider,
          status: "SUCCESS",
        });
        return true;
      }

      recordLoginAudit({
        email: user.email || "",
        provider,
        status: "SUCCESS",
        failReason: "NEW_OAUTH_SIGNUP_PENDING",
      });

      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.pendingOAuthSignup.upsert({
        where: { provider_providerAccountId: { provider, providerAccountId: account.providerAccountId } },
        create: {
          token,
          provider,
          providerAccountId: account.providerAccountId,
          type: account.type,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          refreshToken: account.refresh_token ?? null,
          accessToken: account.access_token ?? null,
          expiresAtProvider: account.expires_at ?? null,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
          idToken: account.id_token ?? null,
          sessionState: typeof account.session_state === "string" ? account.session_state : null,
          expiresAt,
        },
        update: {
          token,
          email: user.email ?? null,
          name: user.name ?? null,
          image: user.image ?? null,
          refreshToken: account.refresh_token ?? null,
          accessToken: account.access_token ?? null,
          expiresAtProvider: account.expires_at ?? null,
          tokenType: account.token_type ?? null,
          scope: account.scope ?? null,
          idToken: account.id_token ?? null,
          sessionState: typeof account.session_state === "string" ? account.session_state : null,
          expiresAt,
        },
      });
      return `/signup?oauth=${provider}&pending=${encodeURIComponent(token)}`;
    },
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
        const dbUser = session.user.id
          ? await prisma.user.findUnique({
              where: { id: session.user.id },
              select: { email: true, name: true, image: true, role: true },
            })
          : null;
        if (dbUser) {
          session.user.email = dbUser.email;
          session.user.name = dbUser.name;
          session.user.image = dbUser.image;
        }
        session.user.role = dbUser?.role === "ADMIN" ? "admin" : "customer";
      }
      return session;
    },
  },
});
