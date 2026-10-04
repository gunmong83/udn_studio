import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { ADMIN_EMAIL } from "@/src/lib/admin";
import { AUTH_SESSION_COOKIE, authSessionCookieOptions } from "@/src/lib/auth-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    pendingToken?: string;
    termsAccepted?: boolean;
    privacyAccepted?: boolean;
  } | null;
  if (!body?.pendingToken || !body.termsAccepted || !body.privacyAccepted) {
    return NextResponse.json({ error: "필수 약관 동의 후 가입을 진행해주세요." }, { status: 400 });
  }

  try {
    const pending = await prisma.pendingOAuthSignup.findUnique({ where: { token: body.pendingToken } });
    if (!pending || pending.expiresAt <= new Date()) {
      if (pending) await prisma.pendingOAuthSignup.delete({ where: { id: pending.id } });
      return NextResponse.json({ error: "인증 정보가 만료되었습니다. 다시 로그인 또는 회원가입을 진행해주세요." }, { status: 410 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // A second tab may have completed the same OAuth flow first.
      const linked = await tx.account.findUnique({
        where: { provider_providerAccountId: { provider: pending.provider, providerAccountId: pending.providerAccountId } },
        include: { user: true },
      });
      if (linked) {
        await tx.pendingOAuthSignup.delete({ where: { id: pending.id } });
        return linked.user;
      }

      // Never merge by email here. An existing email/password account must
      // explicitly link a social provider after password authentication.
      if (pending.email) {
        const emailOwner = await tx.user.findUnique({ where: { email: pending.email } });
        if (emailOwner) throw new Error("EMAIL_ALREADY_IN_USE");
      }

      const agreedAt = new Date();
      const user = await tx.user.create({
        data: {
          email: pending.email,
          name: pending.name,
          image: pending.image,
          role: pending.email?.toLowerCase() === ADMIN_EMAIL ? "ADMIN" : "CUSTOMER",
          termsAgreedAt: agreedAt,
          privacyAgreedAt: agreedAt,
          accounts: {
            create: {
              type: pending.type,
              provider: pending.provider,
              providerAccountId: pending.providerAccountId,
              refresh_token: pending.refreshToken,
              access_token: pending.accessToken,
              expires_at: pending.expiresAtProvider,
              token_type: pending.tokenType,
              scope: pending.scope,
              id_token: pending.idToken,
              session_state: pending.sessionState,
            },
          },
        },
      });
      await tx.pendingOAuthSignup.delete({ where: { id: pending.id } });
      return user;
    });

    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is missing");
    const sessionToken = await encode({
      secret,
      salt: AUTH_SESSION_COOKIE,
      token: { sub: result.id, id: result.id, name: result.name, email: result.email, picture: result.image },
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_SESSION_COOKIE, sessionToken, authSessionCookieOptions);
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_IN_USE") {
      return NextResponse.json(
        { error: "같은 이메일로 가입된 계정이 있습니다. 기존 계정으로 로그인한 뒤 소셜 계정을 연결해주세요." },
        { status: 409 },
      );
    }
    console.error("[oauth-registration] completion failed", { errorCode: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ error: "소셜 회원가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
