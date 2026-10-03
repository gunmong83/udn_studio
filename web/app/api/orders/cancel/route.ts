import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

const TEST_SECRET_KEY = "test_sk_zXLkKEypNArWmo50nX3lmeaxYG5R";

/** 고객 주문 취소: 배송 준비 전까지만 허용합니다. */
export async function POST(request: Request) {
  const session = await auth();
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userId = user.id;
  }
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const cancelReason = typeof body?.cancelReason === "string" && body.cancelReason.trim()
    ? body.cancelReason.trim().slice(0, 200)
    : "고객 요청";
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

  if (["PREPARING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)) {
    return NextResponse.json({ error: "배송 준비가 시작된 주문은 온라인에서 취소할 수 없습니다." }, { status: 409 });
  }

  // 결제 전 주문은 토스 호출 없이 취소 상태만 기록합니다.
  if (order.paymentStatus !== "PAID") {
    const cancelled = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
      include: { items: true },
    });
    return NextResponse.json({ order: cancelled });
  }

  if (!order.paymentKey) {
    return NextResponse.json({ error: "결제 승인 정보가 없어 취소할 수 없습니다." }, { status: 409 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY || TEST_SECRET_KEY;
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
  const tossResponse = await fetch(
    `https://api.tosspayments.com/v1/payments/${encodeURIComponent(order.paymentKey)}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Idempotency-Key": `order-cancel-${order.id}`,
      },
      body: JSON.stringify({ cancelReason }),
    },
  );
  const tossResult = await tossResponse.json().catch(() => null);
  if (!tossResponse.ok) {
    return NextResponse.json(
      { error: tossResult?.message ?? "결제 취소에 실패했습니다.", code: tossResult?.code },
      { status: 400 },
    );
  }

  const cancelled = await prisma.order.update({
    where: { id: order.id },
    data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    include: { items: true },
  });
  return NextResponse.json({ order: cancelled, payment: tossResult });
}
