"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import GoogleMark from "@/src/components/auth/GoogleMark";
import { useLang } from "@/src/lib/store";
import { uiCopy } from "@/src/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const sessionState = useSession();
  const session = sessionState?.data ?? null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const copy = uiCopy(useLang()).auth;

  const loginWithPassword = async () => {
    setMessage("");
    if (!email || !password) return setMessage(copy.email + " and " + copy.password + " are required.");
    setLoadingProvider("credentials");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setMessage(copy.loginError); setLoadingProvider(null); return; }
    router.push("/");
    router.refresh();
  };

  const loginWithOAuth = async (provider: "google" | "naver") => {
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">{copy.login}</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        {session?.user ? (
          <div className="space-y-4 rounded-sm border border-line bg-bg p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-soft text-text">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </div>
            <div>
              <p className="text-body font-bold text-text">{session.user.name ?? copy.account}</p>
              <p className="text-util text-muted">{session.user.email}</p>
              {session.user.role === "admin" && (
                <span className="mt-1 inline-block rounded-xs bg-soft px-2 py-0.5 text-[11px] font-semibold text-text">
                  {copy.admin}
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/mypage"
                className="flex h-11 w-full items-center justify-center bg-text text-nav font-medium text-bg hover:bg-[#444]"
              >
                {copy.mypageOrders}
              </Link>
              <Link
                href="/orders"
                className="flex h-10 w-full items-center justify-center border border-line text-nav text-text hover:bg-soft"
              >
                {copy.allOrders}
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/cart"
                  className="flex h-10 items-center justify-center border border-line text-util text-text hover:bg-soft"
                >
                  {copy.cart}
                </Link>
                <Link
                  href="/wishlist"
                  className="flex h-10 items-center justify-center border border-line text-util text-text hover:bg-soft"
                >
                  {copy.wishlist}
                </Link>
              </div>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="h-10 w-full border border-line text-util text-muted transition-colors hover:bg-soft hover:text-text"
              >
                {copy.logout}
              </button>
            </div>
          </div>
        ) : (
          <>
            <label className="block text-util text-text">{copy.email}<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder={copy.emailPlaceholder} autoComplete="email" /></label>
            <label className="block text-util text-text">{copy.password}<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder={copy.passwordPlaceholder} autoComplete="current-password" /></label>
            {message && <p role="alert" className="text-util text-red-600">{message}</p>}
            <button type="button" aria-busy={loadingProvider === "credentials"} disabled={loadingProvider !== null} onClick={() => void loginWithPassword()} className="h-11 w-full bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50">{loadingProvider === "credentials" ? copy.checking : copy.loginButton}</button>
            <Link href="/signup" className="block h-11 w-full border border-line text-center leading-[44px] text-nav text-text transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text">{copy.signup}</Link>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" aria-label={copy.googleLogin} disabled={loadingProvider !== null} onClick={() => void loginWithOAuth("google")} className="flex h-12 w-12 items-center justify-center rounded-full border border-line transition-colors transition-transform hover:bg-soft active:scale-[.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50">{loadingProvider === "google" ? "…" : <GoogleMark className="h-5 w-5" />}</button>
              <button type="button" aria-label={copy.naverLogin} disabled={loadingProvider !== null} onClick={() => void loginWithOAuth("naver")} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03c75a] text-lg font-bold text-white transition-colors transition-transform hover:bg-[#02b653] active:scale-[.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] disabled:opacity-50">{loadingProvider === "naver" ? "…" : "N"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
