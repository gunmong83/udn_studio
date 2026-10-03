import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.cartItem.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.productId || !body?.title || !Number.isInteger(body?.price) || !Number.isInteger(body?.quantity) || body.quantity < 1) {
    return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
  }
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId: body.productId } },
    update: { title: body.title, price: body.price, quantity: { increment: body.quantity } },
    create: { userId: session.user.id, productId: body.productId, title: body.title, price: body.price, quantity: body.quantity },
  });
  return NextResponse.json({ item }, { status: 201 });
}
