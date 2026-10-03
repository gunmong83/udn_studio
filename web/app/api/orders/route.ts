import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { products } from "@/src/data/products";
import { getShippingFee } from "@/src/lib/shipping";

export async function POST(request: Request) {
  const session = await auth();
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userId = user.id;
  }
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || items.length > 20 || !body?.recipientName || !body?.phone || !body?.address) {
    return NextResponse.json({ error: "Missing order information" }, { status: 400 });
  }

  const orderItems: ({ productId: string; title: string; unitPrice: number; quantity: number } | null)[] = items.map((item: { productId?: string; quantity?: number }) => {
    const product = products.find((candidate) => candidate.slug === item.productId && candidate.kind === "product");
    const quantity = Number(item.quantity);
    if (!product || !product.price || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
    return { productId: product.slug, title: product.title, unitPrice: product.price, quantity };
  });
  if (orderItems.some((item: { productId: string; title: string; unitPrice: number; quantity: number } | null) => !item)) return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 });
  const validItems = orderItems as { productId: string; title: string; unitPrice: number; quantity: number }[];
  const subtotal = validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const totalAmount = subtotal + getShippingFee(subtotal);

  const order = await prisma.order.create({
    data: {
      userId,
      totalAmount,
      recipientName: String(body.recipientName).slice(0, 80),
      phone: String(body.phone).slice(0, 30),
      address: String(body.address).slice(0, 200),
      addressDetail: body.addressDetail ? String(body.addressDetail).slice(0, 200) : undefined,
      items: { create: validItems },
    },
    include: { items: true },
  });
  return NextResponse.json({ order }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userId = user.id;
  }
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

export async function DELETE(request: Request) {
  const session = await auth();
  let userId = session?.user?.id;
  if (!userId && session?.user?.email) {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (user) userId = user.id;
  }
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const url = new URL(request.url);
  const orderId = url.searchParams.get("id");
  if (!orderId) return NextResponse.json({ error: "orderId is required" }, { status: 400 });

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
  });
  if (!order) return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
  if (order.paymentStatus !== "UNPAID" || order.status !== "PENDING" || order.paymentKey) {
    return NextResponse.json({ error: "결제 정보가 있는 주문은 삭제할 수 없습니다." }, { status: 400 });
  }

  await prisma.order.delete({ where: { id: orderId } });
  return NextResponse.json({ success: true });
}
