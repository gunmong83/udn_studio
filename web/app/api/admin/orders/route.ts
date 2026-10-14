import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";
import { cancelNicePayment } from "@/src/lib/nicepay-server";
import { sendOrderCancelledAdminEmail } from "@/src/lib/mailer";
import { validateShipment } from "@/src/lib/delivery-carriers";
import { verifyEpostDelivered, verifyEpostShipment, EpostVerificationError } from "@/src/lib/epost-verification";
import { normalizeMobilePhone } from "@/src/lib/phone-verification";
import { dispatchShipmentNotification, refreshShipmentNotifications } from "@/src/lib/shipment-notification";

export const runtime = "nodejs";

const ORDER_INCLUDE = { items: true, user: { select: { id: true, email: true, name: true } }, shipmentNotification: true } as const;

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CANCELLED"],
  PAID: ["PREPARING"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
};

export async function GET() {
  try {
    await requireAdmin();
    await refreshShipmentNotifications();
    const orders = await prisma.order.findMany({
      include: ORDER_INCLUDE,
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
    const { orderId, status, carrier, trackingNumber, retryAlimtalk } = body ?? {};
    if (typeof orderId !== "string" || !orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const data: {
      status?: "PENDING" | "PAID" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";
      carrier?: string | null;
      trackingNumber?: string | null;
    } = {};

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { shipmentNotification: true } });
    if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });

    if (retryAlimtalk && (order.status !== "SHIPPED" || !order.shipmentNotification || !["READY", "FAILED"].includes(order.shipmentNotification.status))) {
      return NextResponse.json({ error: "실패가 확인된 배송 알림톡만 재발송할 수 있습니다. 접수 또는 결과 미확인 건은 SENS 콘솔을 확인해주세요." }, { status: 409 });
    }

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

    const nextStatus = data.status ?? order.status;
    if (nextStatus === "SHIPPED") {
      if (order.paymentStatus !== "PAID") return NextResponse.json({ error: "결제가 완료된 주문만 배송중으로 처리할 수 있습니다." }, { status: 409 });
      if (!normalizeMobilePhone(order.phone)) return NextResponse.json({ error: "주문 수신자의 휴대전화번호를 확인해주세요." }, { status: 400 });
      try {
        const shipment = validateShipment(data.carrier === undefined ? order.carrier : data.carrier, data.trackingNumber === undefined ? order.trackingNumber : data.trackingNumber);
        data.carrier = shipment.carrier;
        data.trackingNumber = shipment.trackingNumber;
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "배송정보를 확인해주세요." }, { status: 400 });
      }
    }

    const startsShipment = nextStatus === "SHIPPED" && order.status !== "SHIPPED";
    // External lookup must succeed before any DB write or AlimTalk dispatch.
    if (nextStatus === "SHIPPED" && data.carrier === "우체국택배" &&
        (startsShipment || data.carrier !== order.carrier || data.trackingNumber !== order.trackingNumber)) {
      await verifyEpostShipment(data.trackingNumber!);
    }
    if (nextStatus === "DELIVERED" && order.status === "SHIPPED" && (data.carrier ?? order.carrier) === "우체국택배") {
      let shipment: ReturnType<typeof validateShipment>;
      try {
        shipment = validateShipment(data.carrier ?? order.carrier, data.trackingNumber ?? order.trackingNumber);
      } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "배송정보를 확인해주세요." }, { status: 400 });
      }
      await verifyEpostDelivered(shipment.trackingNumber);
    }
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id: orderId }, include: { shipmentNotification: true } });
      if (!current || current.updatedAt.getTime() !== order.updatedAt.getTime() || current.status !== order.status || current.paymentStatus !== order.paymentStatus) throw new Error("ORDER_CONFLICT");
      const notice = current.shipmentNotification;
      const nextCarrier = data.carrier === undefined ? current.carrier : data.carrier;
      const nextNumber = data.trackingNumber === undefined ? current.trackingNumber : data.trackingNumber;
      if (notice && !["READY", "FAILED"].includes(notice.status) && (nextCarrier !== current.carrier || nextNumber !== current.trackingNumber)) {
        throw new Error("SHIPMENT_NOTICE_LOCKED");
      }
      const changed = await tx.order.updateMany({ where: { id: orderId, updatedAt: order.updatedAt, status: order.status, paymentStatus: order.paymentStatus }, data });
      if (changed.count !== 1) throw new Error("ORDER_CONFLICT");
      if (startsShipment && !notice) {
        await tx.shipmentNotification.create({ data: { orderId, carrier: nextCarrier!, trackingNumber: nextNumber! } });
      } else if (notice && ["READY", "FAILED"].includes(notice.status) && nextStatus === "SHIPPED") {
        await tx.shipmentNotification.update({ where: { id: notice.id }, data: { carrier: nextCarrier!, trackingNumber: nextNumber! } });
      }
      return tx.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
    });
    if (status === "CANCELLED") {
      void sendOrderCancelledAdminEmail({ ...updated, cancelReason: "관리자 주문 취소" });
    }

    if (startsShipment || retryAlimtalk) {
      await dispatchShipmentNotification(orderId);
      const notified = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: ORDER_INCLUDE });
      return NextResponse.json({ order: notified });
    }
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof EpostVerificationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (error instanceof Error && error.message === "ORDER_CONFLICT") return NextResponse.json({ error: "다른 요청이 주문을 변경했습니다. 새로고침 후 다시 저장해주세요." }, { status: 409 });
    if (error instanceof Error && error.message === "SHIPMENT_NOTICE_LOCKED") return NextResponse.json({ error: "이미 발송 요청된 배송정보는 변경할 수 없습니다. 발송 결과를 먼저 확인해주세요." }, { status: 409 });
    return NextResponse.json({ error: "Unable to update order" }, { status: 500 });
  }
}
