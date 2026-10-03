import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const paymentKey = typeof body?.paymentKey === "string" ? body.paymentKey : "";
  if (!orderId || !paymentKey) return NextResponse.json({ error: "Missing payment data" }, { status: 400 });

  const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentStatus === "PAID") return NextResponse.json({ error: "Already paid" }, { status: 409 });
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment provider is not configured" }, { status: 503 });

  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: order.totalAmount }),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json({ error: result?.message ?? "Payment confirmation failed" }, { status: 400 });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentKey, paymentStatus: "PAID", status: "PAID" },
  });
  return NextResponse.json({ order: updated, payment: result });
}
