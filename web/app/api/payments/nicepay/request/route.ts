import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getAuthenticatedUserId } from "@/src/lib/session-user";
import { niceConfig } from "@/src/lib/nicepay-server";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const method = body?.method === "계좌이체" ? "bank" : body?.method === "카드" ? "card" : "";
  if (!orderId || !method) return NextResponse.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.status !== "PENDING" || order.paymentStatus !== "UNPAID" || order.paymentKey) {
    return NextResponse.json({ error: "결제를 시작할 수 없는 주문 상태입니다." }, { status: 409 });
  }
  try {
    const { clientId } = niceConfig();
    const title = order.items.length === 1 ? order.items[0].title : `${order.items[0]?.title ?? "상품"} 외 ${order.items.length - 1}건`;
    const configuredOrigin = process.env.AUTH_URL?.trim();
    const origin = configuredOrigin ? new URL(configuredOrigin).origin : new URL(request.url).origin;
    console.info("[nicepay] request prepared", { orderId: order.id, amount: order.totalAmount, method, returnOrigin: origin });
    return NextResponse.json({
      fields: {
        clientId, method, orderId: order.id, amount: order.totalAmount,
        goodsName: title.slice(0, 40), returnUrl: `${origin}/api/payments/nicepay/return`,
        buyerName: order.recipientName, buyerTel: order.phone.replace(/[^0-9]/g, ""),
        buyerEmail: "", returnCharSet: "utf-8",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NICEPAY_CONFIG_MISSING") {
      return NextResponse.json({ error: "나이스페이 결제 설정이 완료되지 않았습니다." }, { status: 503 });
    }
    return NextResponse.json({ error: "결제 요청을 준비하지 못했습니다." }, { status: 500 });
  }
}
