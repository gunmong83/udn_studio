import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { products } from "@/src/data/products";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length || !body?.recipientName || !body?.phone || !body?.address) {
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
  const totalAmount = validItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
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
