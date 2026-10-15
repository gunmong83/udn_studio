import { prisma } from "@/src/lib/prisma";
import { products } from "@/src/data/products";
import { buildCommerceReport } from "@/src/lib/commerce-report";
import type { Prisma } from "@prisma/client";

export async function loadCommerceAnalytics(startDate: Date) {
  const paid: Prisma.OrderWhereInput = { paymentStatus: "PAID", paidAt: { not: null },
    OR: [{ userId: null }, { user: { is: { role: "CUSTOMER" } } }],
    items: { none: { productId: { in: products.filter((p) => p.adminOnly).map((p) => p.slug) } } } };
  const orderSelect = { id: true, analyticsSessionId: true, totalAmount: true, paidAt: true,
    items: { select: { productId: true, title: true, quantity: true, unitPrice: true } } } as const;
  const [sessions, periodOrders] = await Promise.all([
    prisma.analyticsSession.findMany({
      where: { measurementVersion: 1, createdAt: { gte: startDate }, OR: [{ userId: null }, { user: { is: { role: "CUSTOMER" } } }] },
      select: { id: true, visitorId: true, createdAt: true, entryPath: true, device: true, referrerDomain: true,
        utmSource: true, utmMedium: true, utmCampaign: true, utmContent: true,
        pageviews: { select: { path: true, createdAt: true } },
        events: { select: { name: true, productId: true, reason: true, createdAt: true } },
        orders: { where: paid, select: orderSelect } },
    }),
    prisma.order.findMany({ where: { ...paid, paidAt: { gte: startDate }, OR: [{ userId: null }, { user: { is: { role: "CUSTOMER" } } }] }, select: orderSelect }),
  ]);
  return buildCommerceReport(sessions, periodOrders, products);
}
