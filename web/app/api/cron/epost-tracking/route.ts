import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { EpostVerificationError, getEpostTrackingStatus } from "@/src/lib/epost-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const expected = process.env.EPOST_POLLING_TOKEN;
  const authorization = request.headers.get("authorization") ?? "";
  if (!expected || !authorization.startsWith("Bearer ")) return false;
  const actual = Buffer.from(authorization.slice("Bearer ".length));
  const secret = Buffer.from(expected);
  return actual.length === secret.length && timingSafeEqual(actual, secret);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { status: "SHIPPED", carrier: "우체국택배", trackingNumber: { not: null } },
    select: { id: true, trackingNumber: true, updatedAt: true },
    orderBy: { updatedAt: "asc" },
  });

  let delivered = 0;
  let stillInTransit = 0;
  let failed = 0;

  for (const order of orders) {
    if (!order.trackingNumber) continue;
    try {
      const status = await getEpostTrackingStatus(order.trackingNumber);
      const trackingUpdate = {
        epostDeliveryStatus: status.deliveryStatus,
        epostLatestEventDate: status.latestEvent?.date || null,
        epostLatestEventTime: status.latestEvent?.time || null,
        epostLatestEventLocation: status.latestEvent?.location || null,
        epostLatestEventStatus: status.latestEvent?.status || null,
      };
      if (status.deliveryStatus === "배달완료") {
        const result = await prisma.order.updateMany({
          where: { id: order.id, status: "SHIPPED", updatedAt: order.updatedAt },
          data: { ...trackingUpdate, status: "DELIVERED" },
        });
        if (result.count === 1) delivered += 1;
      } else {
        const result = await prisma.order.updateMany({
          where: { id: order.id, status: "SHIPPED", updatedAt: order.updatedAt },
          data: trackingUpdate,
        });
        if (result.count === 1) stillInTransit += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("EPOST scheduled tracking lookup failed", {
        orderId: order.id,
        errorType: error instanceof EpostVerificationError ? "provider" : "internal",
      });
    }
  }

  return NextResponse.json(
    { checked: orders.length, delivered, updated: stillInTransit, stillInTransit, failed },
    { status: failed > 0 ? 502 : 200 },
  );
}
