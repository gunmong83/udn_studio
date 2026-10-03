import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

export async function GET() {
  try {
    await requireAdmin();
    const orders = await prisma.order.findMany({
      include: { items: true, user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ orders });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to load orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const { orderId, status, carrier, trackingNumber } = body ?? {};
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const data: {
      status?: "PENDING" | "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
      carrier?: string | null;
      trackingNumber?: string | null;
    } = {};

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

    if (status === "REFUNDED") {
      if (order.paymentStatus !== "PAID" || !order.paymentKey || order.status !== "PAID") {
        return NextResponse.json({ error: "결제 완료 상태의 주문만 환불할 수 있습니다." }, { status: 409 });
      }
      const secretKey = process.env.TOSS_SECRET_KEY;
      if (!secretKey) return NextResponse.json({ error: "결제 서버 설정이 완료되지 않았습니다." }, { status: 503 });
      const tossResponse = await fetch("https://api.tosspayments.com/v1/payments/" + encodeURIComponent(order.paymentKey) + "/cancel", {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(secretKey + ":").toString("base64"),
          "Content-Type": "application/json",
          "Idempotency-Key": "admin-refund-" + order.id,
        },
        body: JSON.stringify({ cancelReason: "관리자 환불" }),
      });
      const tossResult = await tossResponse.json().catch(() => null);
      if (!tossResponse.ok) return NextResponse.json({ error: tossResult?.message ?? "환불에 실패했습니다." }, { status: 400 });
      const refunded = await prisma.order.update({ where: { id: order.id }, data: { status: "REFUNDED", paymentStatus: "REFUNDED" }, include: { items: true } });
      return NextResponse.json({ order: refunded, payment: tossResult });
    }

    if (status === "CANCELLED" && order.paymentStatus !== "UNPAID") {
      return NextResponse.json({ error: "결제된 주문은 환불 기능으로 처리해주세요." }, { status: 409 });
    }
    if (status && status !== order.status && !ALLOWED_TRANSITIONS[order.status]?.includes(status)) {
      return NextResponse.json({ error: "허용되지 않은 주문 상태 변경입니다." }, { status: 409 });
    }
    if (status) data.status = status;
    if (carrier !== undefined) data.carrier = carrier ? String(carrier).trim() : null;
    if (trackingNumber !== undefined) data.trackingNumber = trackingNumber ? String(trackingNumber).trim() : null;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { items: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
