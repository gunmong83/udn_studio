import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { products } from "@/src/data/products";
import { getAuthenticatedUserId } from "@/src/lib/session-user";

export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length > 50) return NextResponse.json({ error: "장바구니 상품이 너무 많습니다." }, { status: 400 });

  const validItems: { productId: string; title: string; price: number; quantity: number }[] = items.flatMap((item: { slug?: unknown; qty?: unknown }) => {
    const slug = typeof item.slug === "string" ? item.slug : "";
    const qty = Number(item.qty);
    const product = products.find((candidate) => candidate.slug === slug && candidate.kind === "product" && candidate.price != null);
    if (!product || !Number.isInteger(qty) || qty < 1) return [];
    return [{ productId: product.slug, title: product.title, price: product.price as number, quantity: Math.min(qty, 99) }];
  });

  if (validItems.some((item: { productId: string }) => products.find((product) => product.slug === item.productId)?.adminOnly)) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "관리자 전용 테스트 상품입니다." }, { status: 403 });
    }
  }

  await prisma.$transaction(validItems.map((item: { productId: string; title: string; price: number; quantity: number }) => prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId: item.productId } },
    update: { title: item.title, price: item.price, quantity: { increment: item.quantity } },
    create: { userId, productId: item.productId, title: item.title, price: item.price, quantity: item.quantity },
  })));
  const merged = await prisma.cartItem.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ items: merged });
}
