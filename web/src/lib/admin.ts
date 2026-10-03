import { auth } from "@/src/auth";

export const ADMIN_EMAIL = "gunmong83@gmail.com";

export async function requireAdmin() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email || email !== ADMIN_EMAIL) {
    throw new Error("ADMIN_AUTH_REQUIRED");
  }
  return session;
}
