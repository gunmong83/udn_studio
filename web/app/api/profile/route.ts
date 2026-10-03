import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

async function getUserId() {
  const session = await auth();
  if (session?.user?.id) return session.user.id;
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
    return user?.id ?? null;
  }
  return null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, phone: true, defaultRecipientName: true, defaultPhone: true, defaultZonecode: true, defaultAddress: true, defaultAddressDetail: true },
  });
  if (!user) return NextResponse.json({ error: "회원을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ profile: user });
}

export async function PATCH(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const recipientName = String(body?.recipientName ?? "").trim();
  const phone = String(body?.phone ?? "").trim();
  const address = String(body?.address ?? "").trim();
  if (!recipientName || !phone || !address) {
    return NextResponse.json({ error: "받는 분, 연락처, 주소를 입력해주세요." }, { status: 400 });
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      defaultRecipientName: recipientName.slice(0, 80),
      defaultPhone: phone.slice(0, 30),
      defaultZonecode: String(body?.zonecode ?? "").trim().slice(0, 20) || null,
      defaultAddress: address.slice(0, 200),
      defaultAddressDetail: String(body?.addressDetail ?? "").trim().slice(0, 200) || null,
    },
    select: { name: true, phone: true, defaultRecipientName: true, defaultPhone: true, defaultZonecode: true, defaultAddress: true, defaultAddressDetail: true },
  });
  return NextResponse.json({ profile: user });
}
