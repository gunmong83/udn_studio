import { auth } from "@/src/auth";
import { prisma } from "@/src/lib/prisma";

/**
 * Return the authenticated application's User.id only.
 * OAuth email addresses are contact data and must never be used as an
 * ownership fallback because providers may return an alias or backup email.
 */
export async function getAuthenticatedUserId() {
  const session = await auth();
  const userId = session?.user?.id?.trim();
  if (!userId) return null;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  return user?.id ?? null;
}
