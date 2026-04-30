import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const eventSchema = z.object({
  sessionId: z.string().trim().min(8).max(128),
  path: z.string().trim().min(1).max(512),
  referrer: z.string().trim().max(1024).optional().or(z.literal('')),
  event: z.enum(['pageview', 'heartbeat', 'end']).default('pageview'),
  durationSeconds: z.number().int().min(0).max(24 * 60 * 60).optional(),
});

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    ''
  );
}

function hashIp(ip) {
  if (!ip) {
    return null;
  }
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 32);
}

export async function POST(request) {
  const json = await request.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid metrics event' }, { status: 400 });
  }

  const data = parsed.data;
  const now = new Date();

  if (data.event === 'pageview') {
    const visit = await prisma.siteVisit.create({
      data: {
        sessionId: data.sessionId,
        path: data.path,
        referrer: data.referrer || null,
        userAgent: request.headers.get('user-agent') || null,
        ipHash: hashIp(getClientIp(request)),
        startedAt: now,
        lastSeenAt: now,
      },
    });

    return NextResponse.json({ ok: true, visitId: visit.id });
  }

  const latestVisit = await prisma.siteVisit.findFirst({
    where: {
      sessionId: data.sessionId,
      path: data.path,
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  if (!latestVisit) {
    const visit = await prisma.siteVisit.create({
      data: {
        sessionId: data.sessionId,
        path: data.path,
        referrer: data.referrer || null,
        userAgent: request.headers.get('user-agent') || null,
        ipHash: hashIp(getClientIp(request)),
        startedAt: now,
        lastSeenAt: now,
        endedAt: data.event === 'end' ? now : null,
        durationSeconds: data.durationSeconds ?? null,
      },
    });

    return NextResponse.json({ ok: true, visitId: visit.id });
  }

  await prisma.siteVisit.update({
    where: { id: latestVisit.id },
    data: {
      lastSeenAt: now,
      endedAt: data.event === 'end' ? now : latestVisit.endedAt,
      durationSeconds:
        typeof data.durationSeconds === 'number'
          ? Math.max(data.durationSeconds, latestVisit.durationSeconds || 0)
          : latestVisit.durationSeconds,
    },
  });

  return NextResponse.json({ ok: true });
}
