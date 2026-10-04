import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getAuthenticatedUserId } from "@/src/lib/session-user";
import { cancelNicePayment } from "@/src/lib/nicepay-server";

/** 고객 주문 취소: 배송 준비 전까지만 허용합니다. */
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
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

  // 결제 전 주문은 PG 호출 없이 취소 상태만 기록합니다.
  if (order.paymentStatus !== "PAID") {
    const changed = await prisma.order.updateMany({
      where: { id: order.id, userId, paymentStatus: "UNPAID", status: "PENDING" },
      data: { status: "CANCELLED" },
    });
    if (changed.count !== 1) {
      return NextResponse.json({ error: "주문 상태가 변경되어 취소할 수 없습니다." }, { status: 409 });
    }
    const cancelled = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    return NextResponse.json({ order: cancelled });
  }

  if (!order.paymentKey) {
    return NextResponse.json({ error: "결제 승인 정보가 없어 취소할 수 없습니다." }, { status: 409 });
  }

  let paymentResult: unknown;
  try {
    paymentResult = await cancelNicePayment({ tid: order.paymentKey, orderId: order.id, reason: cancelReason });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "결제 취소에 실패했습니다." }, { status: 400 });
  }

  const changed = await prisma.order.updateMany({
    where: { id: order.id, userId, paymentStatus: "PAID", status: "PAID" },
    data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
  });
  if (changed.count !== 1) {
    return NextResponse.json({ error: "결제 취소는 완료되었지만 주문 상태 동기화가 필요합니다." }, { status: 409 });
  }
  const cancelled = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  return NextResponse.json({ order: cancelled, payment: paymentResult });
}
