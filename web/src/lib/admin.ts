import { prisma } from "@/src/lib/prisma";

export const ADMIN_EMAIL = "studioudn@naver.com";
export const ADMIN_EMAILS = [ADMIN_EMAIL];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function requireAdmin() {
  const { auth } = await import("@/src/auth");
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!session || !userId) throw new Error("ADMIN_AUTH_REQUIRED");
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") throw new Error("ADMIN_AUTH_REQUIRED");
  return session;
}
