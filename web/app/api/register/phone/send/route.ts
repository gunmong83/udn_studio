import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { clientIp } from "@/src/lib/request-rate-limit";
import { createOtp, normalizeMobilePhone, phoneVerificationExpiry, verificationHash } from "@/src/lib/phone-verification";
import { AlimtalkError, assertAlimtalkConfigured, sendAlimtalk, signupMessage, SIGNUP_TEMPLATE_CODE } from "@/src/lib/sens-alimtalk";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { phone?: string } | null;
    const phone = normalizeMobilePhone(body?.phone);
    if (!phone) return NextResponse.json({ error: "휴대전화번호를 정확히 입력해주세요." }, { status: 400 });
    try { assertAlimtalkConfigured(); } catch {
      return NextResponse.json({ error: "휴대폰 인증 서비스 설정이 완료되지 않았습니다. 고객지원에 문의해주세요." }, { status: 503 });
    }

    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const ipHash = verificationHash("ip", clientIp(request.headers));
    const id = `pv_${randomUUID()}`;
    const code = createOtp();
    // Serialize rate checks and challenge creation so concurrent requests do
    // not all pass the cooldown. Failed sends still count against the limit.
    const limited = await prisma.$transaction(async (tx) => {
      const lastSend = await tx.phoneVerificationChallenge.findFirst({
        where: { phone }, orderBy: { createdAt: "desc" }, select: { createdAt: true },
      });
      if (lastSend && now.getTime() - lastSend.createdAt.getTime() < 60_000) {
        return { error: "인증번호를 방금 보냈어요. 잠시 후 다시 요청해주세요.", retryAfter: Math.ceil((60_000 - (now.getTime() - lastSend.createdAt.getTime())) / 1000) };
      }
      const phoneSends = await tx.phoneVerificationChallenge.count({ where: { phone, createdAt: { gt: hourAgo } } });
      const ipSends = await tx.phoneVerificationChallenge.count({ where: { requestIpHash: ipHash, createdAt: { gt: hourAgo } } });
      if (phoneSends >= 5 || ipSends >= 10) return { error: "인증 요청 횟수를 초과했습니다. 한 시간 후 다시 시도해주세요.", retryAfter: 3600 };
      await tx.phoneVerificationChallenge.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
      await tx.phoneVerificationChallenge.updateMany({ where: { phone, consumedAt: null }, data: { expiresAt: now } });
      await tx.phoneVerificationChallenge.create({
        data: { id, phone, requestIpHash: ipHash, codeHash: verificationHash("otp", `${id}:${code}`), expiresAt: phoneVerificationExpiry(now.getTime()) },
      });
      return null;
    });
    if (limited) return NextResponse.json(limited, { status: 429 });

    try {
      await sendAlimtalk(SIGNUP_TEMPLATE_CODE, signupMessage(phone, code));
    } catch (error) {
      await prisma.phoneVerificationChallenge.update({ where: { id }, data: { expiresAt: new Date() } });
      console.error("[phone-verification] AlimTalk request failed", { code: error instanceof AlimtalkError ? error.code : "unknown" });
      return NextResponse.json({ error: "카카오 알림톡 발송에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
    }
    return NextResponse.json({ challengeId: id, expiresIn: 180, retryAfter: 60 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "휴대폰 인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
  }
}
