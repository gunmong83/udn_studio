import { auth } from "@/src/auth";

export const ADMIN_EMAIL = "gunmong83@gmail.com";
export const ADMIN_EMAILS = [ADMIN_EMAIL];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || !isAdminEmail(email)) {
    throw new Error("ADMIN_AUTH_REQUIRED");
  }
  return session;
}
