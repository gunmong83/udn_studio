import { NextResponse } from "next/server";
import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";
import { getProduct } from "@/src/data/products";

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
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const quantity = Number(body?.quantity);
  const product = getProduct(productId);
  if (!product || product.kind !== "product" || product.price == null || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return NextResponse.json({ error: "Invalid cart item" }, { status: 400 });
  }
  if (product.adminOnly) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    if (user?.role !== "ADMIN") return NextResponse.json({ error: "관리자 전용 테스트 상품입니다." }, { status: 403 });
  }
  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: session.user.id, productId } },
    update: { title: product.title, price: product.price, quantity: { increment: quantity } },
    create: { userId: session.user.id, productId, title: product.title, price: product.price, quantity },
  });
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const quantity = Number(body?.quantity);
  if (!productId || !Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    return NextResponse.json({ error: "Invalid cart quantity" }, { status: 400 });
  }
  if (quantity === 0) {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id, productId } });
    return NextResponse.json({ item: null });
  }
  const item = await prisma.cartItem.updateMany({ where: { userId: session.user.id, productId }, data: { quantity } });
  if (item.count === 0) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const productId = typeof body?.productId === "string" ? body.productId : "";
  if (productId) {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id, productId } });
  } else {
    await prisma.cartItem.deleteMany({ where: { userId: session.user.id } });
  }
  return NextResponse.json({ ok: true });
}
