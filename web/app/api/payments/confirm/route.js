import { NextResponse } from 'next/server';
import { z } from 'zod';
import { confirmTossPayment } from '@/lib/payment';
import { prisma } from '@/lib/prisma';

const confirmSchema = z.object({
  paymentKey: z.string().trim().min(1),
  orderId: z.string().trim().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request) {
  const json = await request.json();
  const parsed = confirmSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payment confirmation' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId: parsed.data.orderId },
  });

  if (!payment || payment.amount !== parsed.data.amount) {
    return NextResponse.json({ error: 'Payment request does not match saved order' }, { status: 400 });
  }

  try {
    const confirmed = await confirmTossPayment(parsed.data);
    const saved = await prisma.payment.update({
      where: { orderId: parsed.data.orderId },
      data: {
        status: 'APPROVED',
        paymentKey: confirmed.paymentKey,
        method: confirmed.method || null,
        approvedAt: confirmed.approvedAt ? new Date(confirmed.approvedAt) : new Date(),
        rawResponse: JSON.stringify(confirmed),
      },
    });

    return NextResponse.json({ payment: saved, provider: confirmed });
  } catch (error) {
    await prisma.payment.update({
      where: { orderId: parsed.data.orderId },
      data: {
        status: 'FAILED',
        failReason: error.message,
      },
    });

    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
