import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { createVerificationToken, normalizeMobilePhone, verificationHash } from "@/src/lib/phone-verification";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { phone?: string; challengeId?: string; code?: string } | null;
    const phone = normalizeMobilePhone(body?.phone);
    const challengeId = String(body?.challengeId ?? "");
    const code = String(body?.code ?? "").trim();
    if (!phone || !/^pv_[\da-f-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "인증번호를 확인하고 다시 입력해주세요." }, { status: 400 });
    }

    const now = new Date();
    await prisma.phoneVerificationChallenge.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } });
    const used = await prisma.phoneVerificationChallenge.updateMany({
      where: { id: challengeId, phone, verifiedAt: null, consumedAt: null, expiresAt: { gt: now }, attempts: { lt: 5 } },
      data: { attempts: { increment: 1 } },
    });
    if (used.count !== 1) {
      return NextResponse.json({ error: "인증번호가 만료되었거나 입력 횟수를 초과했어요. 새 인증번호를 요청해주세요." }, { status: 400 });
    }

    const challenge = await prisma.phoneVerificationChallenge.findUnique({ where: { id: challengeId } });
    const submittedHash = Buffer.from(verificationHash("otp", `${challengeId}:${code}`), "hex");
    const storedHash = Buffer.from(challenge?.codeHash ?? "0".repeat(64), "hex");
    if (!challenge || !timingSafeEqual(submittedHash, storedHash)) {
      return NextResponse.json({ error: "인증번호가 일치하지 않습니다. 다시 확인해주세요." }, { status: 400 });
    }

    const token = createVerificationToken();
    const verified = await prisma.phoneVerificationChallenge.updateMany({
      where: { id: challengeId, verifiedAt: null, consumedAt: null, expiresAt: { gt: new Date() } },
      data: { verifiedAt: new Date(), verificationTokenHash: verificationHash("token", token), expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    });
    if (verified.count !== 1) {
      return NextResponse.json({ error: "인증번호가 이미 사용되었거나 만료되었습니다. 다시 요청해주세요." }, { status: 400 });
    }

    return NextResponse.json({ ok: true, verificationToken: token, expiresIn: 900 }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "휴대폰 인증 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }, { status: 503 });
  }
}
