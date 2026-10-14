import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";
import { EpostVerificationError, getEpostTrackingStatus } from "@/src/lib/epost-verification";
import { validateShipment } from "@/src/lib/delivery-carriers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json().catch(() => null);
    const orderId = body?.orderId;
    if (typeof orderId !== "string" || !orderId) {
      return NextResponse.json({ error: "orderId가 필요합니다." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, carrier: true, trackingNumber: true, updatedAt: true },
    });
    if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    if (order.status !== "SHIPPED" || order.carrier !== "우체국택배" || !order.trackingNumber) {
      return NextResponse.json({ error: "배송중인 우체국택배 주문만 조회할 수 있습니다." }, { status: 409 });
    }

    const shipment = validateShipment(order.carrier, order.trackingNumber);
    const tracking = await getEpostTrackingStatus(shipment.trackingNumber);
    const completed = tracking.deliveryStatus === "배달완료";

    const changed = await prisma.order.updateMany({
      where: { id: order.id, status: "SHIPPED", updatedAt: order.updatedAt },
      data: {
        epostDeliveryStatus: tracking.deliveryStatus,
        epostLatestEventDate: tracking.latestEvent?.date || null,
        epostLatestEventTime: tracking.latestEvent?.time || null,
        epostLatestEventLocation: tracking.latestEvent?.location || null,
        epostLatestEventStatus: tracking.latestEvent?.status || null,
        ...(completed ? { status: "DELIVERED" } : {}),
      },
    });
    if (changed.count !== 1) {
      return NextResponse.json({ error: "주문이 다른 요청으로 변경됐습니다. 새로고침 후 다시 확인해주세요." }, { status: 409 });
    }

    return NextResponse.json({
      deliveryStatus: tracking.deliveryStatus,
      latestEvent: tracking.latestEvent,
      completed,
    });
  } catch (error) {
    if (error instanceof EpostVerificationError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("EPOST manual status check failed", error);
    return NextResponse.json({ error: "우체국 배송상태를 확인하지 못했습니다." }, { status: 500 });
  }
}
