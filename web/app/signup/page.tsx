"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignupPage() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState<"google" | "naver" | "form" | null>(null);
  const [message, setMessage] = useState("");

  const oauth = async (provider: "google" | "naver") => {
    if (!terms || !privacy) { setMessage("이용약관과 개인정보 수집·이용에 동의해주세요."); return; }
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  const register = async () => {
    setMessage("");
    if (!terms || !privacy) return setMessage("이용약관과 개인정보 수집·이용에 동의해주세요.");
    if (password !== passwordConfirm) return setMessage("비밀번호 확인이 일치하지 않습니다.");
    setLoading("form");
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, name, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "가입에 실패했습니다.");
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "가입에 실패했습니다.");
      setLoading(null);
    }
  };

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">회원가입</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        <p className="text-body text-muted">계정을 만들면 주문·배송 정보를 안전하게 관리할 수 있습니다.</p>
        <div className="flex gap-3">
          <button type="button" aria-label="Google로 가입" disabled={loading !== null} className="flex h-12 flex-1 items-center justify-center gap-2 border border-line text-nav transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50" onClick={() => void oauth("google")}><span className="font-semibold">{loading === "google" ? "…" : "G"}</span> Google</button>
          <button type="button" aria-label="Naver로 가입" disabled={loading !== null} className="flex h-12 flex-1 items-center justify-center gap-2 bg-[#03c75a] text-nav font-semibold text-white transition-colors transition-transform hover:bg-[#02b653] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] disabled:opacity-50" onClick={() => void oauth("naver")}><span>{loading === "naver" ? "…" : "N"}</span> Naver</button>
        </div>
        <div className="border-t border-line pt-4" />
        <label className="block text-util text-text">이름<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder="이름" autoComplete="name" /></label>
        <label className="block text-util text-text">이메일 (아이디)<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder="name@example.com" autoComplete="email" /></label>
        <label className="block text-util text-text">비밀번호<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder="8자 이상" autoComplete="new-password" /></label>
        <label className="block text-util text-text">비밀번호 확인<input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" autoComplete="new-password" /></label>
        <label className="flex gap-2 text-util"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" className="underline transition-colors hover:text-text">이용약관</Link> 동의 (필수)</span></label>
        <label className="flex gap-2 text-util"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> <span><Link href="/privacy" className="underline transition-colors hover:text-text">개인정보 수집·이용</Link> 동의 (필수)</span></label>
        {message && <p role="alert" className="text-util text-red-600">{message}</p>}
        <button type="button" disabled={loading !== null} aria-busy={loading === "form"} onClick={() => void register()} className="h-11 w-full bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-40">{loading === "form" ? "가입 처리 중…" : "가입하기"}</button>
      </div>
    </div>
  );
}
