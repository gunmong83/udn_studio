import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/admin";

export async function GET() {
  try {
    await requireAdmin();
    const members = await prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, createdAt: true, _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ members });
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_AUTH_REQUIRED") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unable to load members" }, { status: 500 });
  }
}
