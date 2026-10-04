import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";
import { cancelNicePayment } from "@/src/lib/nicepay-server";
import { sendOrderCancelledAdminEmail } from "@/src/lib/mailer";

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
      let paymentResult: unknown;
      try {
        paymentResult = await cancelNicePayment({ tid: order.paymentKey, orderId: order.id, reason: "관리자 환불" });
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "환불에 실패했습니다." }, { status: 400 });
      }
      const refunded = await prisma.order.update({
        where: { id: order.id },
        data: { status: "REFUNDED", paymentStatus: "REFUNDED" },
        include: { items: true, user: { select: { email: true, name: true } } },
      });
      void sendOrderCancelledAdminEmail({ ...refunded, cancelReason: "관리자 환불 처리" });
      return NextResponse.json({ order: refunded, payment: paymentResult });
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
      include: { items: true, user: { select: { email: true, name: true } } },
    });
    if (status === "CANCELLED") {
      void sendOrderCancelledAdminEmail({ ...updated, cancelReason: "관리자 주문 취소" });
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
