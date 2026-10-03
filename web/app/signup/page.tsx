"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import GoogleMark from "@/src/components/auth/GoogleMark";
import { useLang } from "@/src/lib/store";
import { uiCopy } from "@/src/lib/i18n";

export default function SignupPage() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState<"google" | "naver" | "form" | null>(null);
  const [message, setMessage] = useState("");
  const copy = uiCopy(useLang()).auth;

  const oauth = async (provider: "google" | "naver") => {
    if (!terms || !privacy) { setMessage(copy.termsError); return; }
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  const register = async () => {
    setMessage("");
    if (!terms || !privacy) return setMessage(copy.termsError);
    if (password !== passwordConfirm) return setMessage(copy.passwordError);
    setLoading("form");
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, name, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? copy.registerError);
      await signIn("credentials", { email, password, callbackUrl: "/" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.registerError);
      setLoading(null);
    }
  };

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">{copy.signup}</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        <p className="text-body text-muted">{copy.signupIntro}</p>
        <div className="border border-line bg-soft/30 p-4">
          <p className="text-util font-medium text-text">{copy.agreeIntro}</p>
          <div className="mt-3 space-y-3">
            <label className="flex gap-2 text-util"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" className="underline transition-colors hover:text-text">{copy.terms}</Link> {copy.required}</span></label>
            <label className="flex gap-2 text-util"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> <span><Link href="/privacy" className="underline transition-colors hover:text-text">{copy.privacy}</Link> {copy.required}</span></label>
          </div>
        </div>
        <div className="flex gap-3">
          <button type="button" aria-label={copy.googleSignup} disabled={loading !== null} className="flex h-12 flex-1 items-center justify-center gap-2 border border-line text-nav transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50" onClick={() => void oauth("google")}>{loading === "google" ? "…" : <GoogleMark className="h-5 w-5" />} Google</button>
          <button type="button" aria-label={copy.naverSignup} disabled={loading !== null} className="flex h-12 flex-1 items-center justify-center gap-2 bg-[#03c75a] text-nav font-semibold text-white transition-colors transition-transform hover:bg-[#02b653] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] disabled:opacity-50" onClick={() => void oauth("naver")}><span>{loading === "naver" ? "…" : "N"}</span> Naver</button>
        </div>
        <div className="border-t border-line pt-4" />
        <label className="block text-util text-text">{copy.name}<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder={copy.namePlaceholder} autoComplete="name" /></label>
        <label className="block text-util text-text">{copy.emailId}<input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder="name@example.com" autoComplete="email" /></label>
        <label className="block text-util text-text">{copy.password}<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder={copy.passwordHint} autoComplete="new-password" /></label>
        <label className="block text-util text-text">{copy.passwordConfirm}<input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" className="mt-2 h-11 w-full border border-line px-3" autoComplete="new-password" /></label>
        {message && <p role="alert" className="text-util text-red-600">{message}</p>}
        <button type="button" disabled={loading !== null} aria-busy={loading === "form"} onClick={() => void register()} className="h-11 w-full bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-40">{loading === "form" ? copy.processing : copy.signupButton}</button>
      </div>
    </div>
  );
}
