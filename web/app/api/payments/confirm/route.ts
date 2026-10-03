import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { sendPaymentAdminEmail } from "@/src/lib/mailer";

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
  const paymentKey = typeof body?.paymentKey === "string" ? body.paymentKey : "";
  if (!orderId || !paymentKey) {
    return NextResponse.json({ error: "Missing payment data" }, { status: 400 });
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // 1. 이미 결제 완료(PAID)된 상태인 경우 성공으로 바로 반환 (멱등성 보장)
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ order, message: "Already paid" }, { status: 200 });
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "결제 서버 설정이 완료되지 않았습니다." }, { status: 503 });
  }
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;

  // 2. 토스 결제 승인 요청
  const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentKey, orderId, amount: order.totalAmount }),
  });

  const result = await response.json().catch(() => null);

  // 3. 승인 응답이 정상이 아닌 경우 (동시 호출 이슈 또는 ALREADY_PROCESSING_REQUEST 등)
  if (!response.ok) {
    // 3-1. 다른 동시 요청에 의해 이미 DB가 PAID 처리되었는지 확인
    const recheckedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    if (recheckedOrder?.paymentStatus === "PAID") {
      return NextResponse.json({ order: recheckedOrder, payment: result }, { status: 200 });
    }

    // 3-2. 토스 결제 단건 조회 API를 통해 실제 토스 승인 성공(DONE) 여부 재확인
    try {
      const checkRes = await fetch(
        `https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}`,
        { headers: { Authorization: authHeader } }
      );
      if (checkRes.ok) {
        const checkData = await checkRes.json().catch(() => null);
        if (checkData?.status === "DONE" && checkData?.orderId === orderId) {
          const changed = await prisma.order.updateMany({
            where: { id: order.id, userId, paymentStatus: "UNPAID", status: "PENDING" },
            data: { paymentKey, paymentStatus: "PAID", status: "PAID" },
          });
          if (changed.count !== 1) {
            const current = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
            if (current?.paymentStatus === "PAID") {
              return NextResponse.json({ order: current, payment: checkData }, { status: 200 });
            }
            return NextResponse.json({ error: "주문 상태가 변경되어 결제를 완료할 수 없습니다." }, { status: 409 });
          }
          const updated = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
          if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
          void sendPaymentAdminEmail(updated);
          return NextResponse.json({ order: updated, payment: checkData }, { status: 200 });
        }
      }
    } catch {
      // 조회 실패 시 아래의 실패 에러 반환으로 진행
    }

    return NextResponse.json(
      { error: result?.message ?? "Payment confirmation failed", code: result?.code },
      { status: 400 }
    );
  }

  if (result?.status !== "DONE") {
    return NextResponse.json(
      { error: "결제가 아직 완료되지 않았습니다. 결제 상태를 확인한 뒤 다시 시도해주세요.", code: result?.status },
      { status: 409 },
    );
  }

  // 4. 정상 승인 완료 -> DB 상태 업데이트
  const current = await prisma.order.findFirst({ where: { id: order.id, userId, paymentStatus: "UNPAID", status: "PENDING" } });
  if (!current) {
    return NextResponse.json({ error: "주문 상태가 변경되어 결제를 완료할 수 없습니다." }, { status: 409 });
  }
  const updated = await prisma.order.update({
    where: { id: current.id },
    data: { paymentKey, paymentStatus: "PAID", status: "PAID" },
    include: { items: true },
  });
  void sendPaymentAdminEmail(updated);

  return NextResponse.json({ order: updated, payment: result });
}
