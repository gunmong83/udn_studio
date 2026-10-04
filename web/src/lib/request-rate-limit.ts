import { createHmac } from "node:crypto";
import { prisma } from "@/src/lib/prisma";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;
const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_ATTEMPTS = 5;

type RateLimitScope = "login" | "register";

function hashKey(scope: RateLimitScope, value: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required for request limiting.");
  return createHmac("sha256", secret).update(`${scope}:${value}`).digest("hex");
}

/** Nginx supplies X-Real-IP only after validating Cloudflare's proxy ranges. */
export function clientIp(headers: Headers) {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded?.slice(0, 64) || "unknown";
}

function windowConfig(scope: RateLimitScope) {
  return scope === "login"
    ? { windowMs: LOGIN_WINDOW_MS, maximum: LOGIN_MAX_FAILURES }
    : { windowMs: REGISTER_WINDOW_MS, maximum: REGISTER_MAX_ATTEMPTS };
}

async function isBlocked(scope: RateLimitScope, values: string[]) {
  const now = new Date();
  const { windowMs, maximum } = windowConfig(scope);
  const keys = values.map((value) => hashKey(scope, value));
  const entries = await prisma.requestRateLimit.findMany({ where: { key: { in: keys } } });
  return entries.some((entry) =>
    (entry.blockedUntil !== null && entry.blockedUntil > now)
    || (entry.windowStartedAt > new Date(now.getTime() - windowMs) && entry.count >= maximum),
  );
}

async function record(scope: RateLimitScope, values: string[]) {
  const now = new Date();
  const { windowMs, maximum } = windowConfig(scope);
  const keys = values.map((value) => hashKey(scope, value));
  await prisma.$transaction(async (tx) => {
    for (const key of keys) {
      const entry = await tx.requestRateLimit.findUnique({ where: { key } });
      if (!entry || entry.windowStartedAt <= new Date(now.getTime() - windowMs)) {
        await tx.requestRateLimit.upsert({
          where: { key },
          create: { key, count: 1, windowStartedAt: now, blockedUntil: null },
          update: { count: 1, windowStartedAt: now, blockedUntil: null },
        });
        continue;
      }
      const count = entry.count + 1;
      await tx.requestRateLimit.update({
        where: { key },
        data: { count, blockedUntil: count >= maximum ? new Date(now.getTime() + windowMs) : null },
      });
    }
  });
}

async function clear(scope: RateLimitScope, values: string[]) {
  await prisma.requestRateLimit.deleteMany({ where: { key: { in: values.map((value) => hashKey(scope, value)) } } });
}

export async function allowLoginAttempt(email: string, ip: string) {
  return !(await isBlocked("login", [`email:${email}`, `ip:${ip}`]));
}

export async function recordFailedLogin(email: string, ip: string) {
  await record("login", [`email:${email}`, `ip:${ip}`]);
}

export async function clearLoginFailures(email: string, ip: string) {
  await clear("login", [`email:${email}`, `ip:${ip}`]);
}

export async function allowRegistrationAttempt(email: string, ip: string) {
  return !(await isBlocked("register", [`email:${email}`, `ip:${ip}`]));
}

export async function recordRegistrationAttempt(email: string, ip: string) {
  await record("register", [`email:${email}`, `ip:${ip}`]);
}
