import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

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
