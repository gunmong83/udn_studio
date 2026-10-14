import { createHmac, randomInt, randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

const OTP_TTL_MS = 3 * 60 * 1000;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is required for phone verification.");
  return value;
}

export function normalizeMobilePhone(value: unknown) {
  if (typeof value !== "string" || !/^[\d\s()-]+$/.test(value.trim())) return null;
  const phone = value.replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(phone) ? phone : null;
}

export function verificationHash(kind: "otp" | "token" | "ip", value: string) {
  return createHmac("sha256", secret()).update(`${kind}:${value}`).digest("hex");
}

export function createOtp() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export const phoneVerificationExpiry = (now = Date.now()) => new Date(now + OTP_TTL_MS);

/** Consume proof once, in the same transaction that creates the member. */
export async function consumePhoneVerification(
  tx: Prisma.TransactionClient,
  phone: string,
  token: string,
) {
  const verificationTokenHash = verificationHash("token", token);
  const challenge = await tx.phoneVerificationChallenge.findFirst({
    where: {
      phone,
      verificationTokenHash,
      verifiedAt: { not: null },
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: { id: true, verifiedAt: true },
  });
  if (!challenge?.verifiedAt) return null;

  const consumed = await tx.phoneVerificationChallenge.updateMany({
    where: { id: challenge.id, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });
  if (consumed.count !== 1) return null;
  // Retain consumed metadata until daily pruning so successful signups cannot
  // erase the resend/cooldown counters. The proof is already single-use.
  return challenge.verifiedAt;
}
