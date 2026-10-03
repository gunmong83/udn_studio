"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const sessionState = useSession();
  const session = sessionState?.data ?? null;
  const status = sessionState?.status ?? "unauthenticated";
  const loading = status === "loading";
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const loginWithPassword = async () => {
    setMessage("");
    if (!email || !password) return setMessage("이메일과 비밀번호를 입력해주세요.");
    setLoadingProvider("credentials");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) { setMessage("이메일 또는 비밀번호를 확인해주세요."); setLoadingProvider(null); return; }
    window.location.href = "/";
  };

  const loginWithOAuth = async (provider: "google" | "naver") => {
    if (!agreed) return setMessage("로그인 전 이용약관과 개인정보처리방침에 동의해주세요.");
    setLoadingProvider(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">LOGIN</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        {loading ? <p className="text-body text-muted">로그인 상태를 확인하고 있습니다.</p> : session?.user ? (
          <>
            <p className="text-body text-muted">로그인되어 있습니다.</p>
            <p className="text-body font-semibold text-text">{session.user.name ?? "회원"} · {session.user.email}</p>
            {session.user.role === "admin" && <p className="text-util text-muted">관리자 계정</p>}
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="h-10 w-full border border-line text-nav text-text transition-colors hover:bg-soft">로그아웃</button>
          </>
        ) : (
          <>
            <label className="block text-util text-text">이메일<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder="이메일을 입력해주세요" autoComplete="email" /></label>
            <label className="block text-util text-text">비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder="비밀번호를 입력해주세요" autoComplete="current-password" /></label>
            {message && <p role="alert" className="text-util text-red-600">{message}</p>}
            <button type="button" aria-busy={loadingProvider === "credentials"} disabled={loadingProvider !== null} onClick={() => void loginWithPassword()} className="h-11 w-full bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50">{loadingProvider === "credentials" ? "확인 중…" : "로그인"}</button>
            <Link href="/signup" className="block h-11 w-full border border-line text-center leading-[44px] text-nav text-text transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text">회원가입</Link>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" aria-label="Google로 로그인" disabled={loadingProvider !== null} onClick={() => void loginWithOAuth("google")} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-lg font-semibold transition-colors transition-transform hover:bg-soft active:scale-[.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50">{loadingProvider === "google" ? "…" : "G"}</button>
              <button type="button" aria-label="Naver로 로그인" disabled={loadingProvider !== null} onClick={() => void loginWithOAuth("naver")} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03c75a] text-lg font-bold text-white transition-colors transition-transform hover:bg-[#02b653] active:scale-[.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] disabled:opacity-50">{loadingProvider === "naver" ? "…" : "N"}</button>
            </div>
            <label className="flex items-start gap-2 pt-2 text-util text-muted"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />로그인 및 회원가입 시 <Link href="/terms" className="underline transition-colors hover:text-text">이용약관</Link>과 <Link href="/privacy" className="underline transition-colors hover:text-text">개인정보처리방침</Link>에 동의합니다.</label>
          </>
        )}
      </div>
    </div>
  );
}
