import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createOrderId, getSiteUrl } from '@/lib/payment';
import { prisma } from '@/lib/prisma';

const prepareSchema = z.object({
  product: z.object({
    name: z.string().trim().min(1),
    amount: z.number().int().positive(),
  }),
  customer: z.object({
    name: z.string().trim().min(1),
    email: z.string().trim().email().optional().or(z.literal('')),
    phone: z.string().trim().min(1),
    address: z.string().trim().optional().or(z.literal('')),
    memo: z.string().trim().optional().or(z.literal('')),
  }),
});

export async function POST(request) {
  const json = await request.json();
  const parsed = prepareSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payment request' }, { status: 400 });
  }

  const orderId = createOrderId();
  const { product, customer } = parsed.data;

  const savedCustomer = await prisma.customer.create({
    data: {
      name: customer.name,
      email: customer.email || null,
      phone: customer.phone,
      address: customer.address || null,
      memo: customer.memo || null,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      orderId,
      orderName: product.name,
      amount: product.amount,
      customerId: savedCustomer.id,
    },
  });

  const siteUrl = getSiteUrl();

  return NextResponse.json({
    customer: savedCustomer,
    payment,
    checkout: {
      clientKey: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '',
      orderId,
      orderName: product.name,
      amount: product.amount,
      customerName: customer.name,
      customerEmail: customer.email || undefined,
      successUrl: `${siteUrl}/payment/success`,
      failUrl: `${siteUrl}/payment/fail`,
    },
  });
}
