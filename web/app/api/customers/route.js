import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const customerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().or(z.literal('')),
  phone: z.string().trim().optional().or(z.literal('')),
  address: z.string().trim().optional().or(z.literal('')),
  memo: z.string().trim().optional().or(z.literal('')),
});

export async function POST(request) {
  const json = await request.json();
  const parsed = customerSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid customer data' }, { status: 400 });
  }

  const customer = await prisma.customer.create({
    data: {
      ...parsed.data,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      memo: parsed.data.memo || null,
    },
  });

  return NextResponse.json({ customer });
}
