import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { hashPassword } from "@/src/lib/password";
import { ADMIN_EMAIL } from "@/src/lib/admin";
import { allowRegistrationAttempt, clientIp, recordRegistrationAttempt } from "@/src/lib/request-rate-limit";

export const runtime = "nodejs";

function normalizeMobilePhone(value: unknown) {
  const phone = String(value ?? "").replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(phone) ? phone : null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string; name?: string; phone?: string; recipientName?: string; zonecode?: string; address?: string; addressDetail?: string; termsAccepted?: boolean; privacyAccepted?: boolean };
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const name = String(body.name ?? "").trim() || null;
    const phone = normalizeMobilePhone(body.phone);
    const recipientName = String(body.recipientName ?? "").trim();
    const zonecode = String(body.zonecode ?? "").trim();
    const address = String(body.address ?? "").trim();
    const ip = clientIp(request.headers);
    if (email === ADMIN_EMAIL) return NextResponse.json({ error: "관리자 계정은 별도 등록이 필요합니다." }, { status: 403 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "올바른 이메일을 입력해주세요." }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: "비밀번호는 8자 이상이어야 합니다." }, { status: 400 });
    if (!body.termsAccepted || !body.privacyAccepted) return NextResponse.json({ error: "필수 약관 동의가 필요합니다." }, { status: 400 });
    if (!phone) return NextResponse.json({ error: "올바른 휴대전화번호를 입력해주세요." }, { status: 400 });
    if (!recipientName || !zonecode || !address) return NextResponse.json({ error: "받는 분과 기본 배송지를 입력해주세요." }, { status: 400 });
    if (!(await allowRegistrationAttempt(email, ip))) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    await recordRegistrationAttempt(email, ip);
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "이미 가입된 이메일입니다." }, { status: 409 });
    const agreedAt = new Date();
    const user = await prisma.user.create({
      data: {
        email,
        name,
        phone,
        defaultRecipientName: recipientName.slice(0, 80),
        defaultPhone: phone,
        defaultZonecode: zonecode.slice(0, 20),
        defaultAddress: address.slice(0, 200),
        defaultAddressDetail: String(body.addressDetail ?? "").trim().slice(0, 200) || null,
        passwordHash: await hashPassword(password),
        termsAgreedAt: agreedAt,
        privacyAgreedAt: agreedAt,
      },
    });
    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
  } catch (error) {
    console.error("Registration failed", error);
    return NextResponse.json({ error: "가입 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
