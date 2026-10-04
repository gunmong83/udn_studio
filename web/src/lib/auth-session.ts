export const AUTH_SESSION_COOKIE = "udn.session-token";

export const authSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  // AUTH_URL is http on the local test server and https in production.
  secure: process.env.AUTH_URL?.startsWith("https://") ?? false,
};
