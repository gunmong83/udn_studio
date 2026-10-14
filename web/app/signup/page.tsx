"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import GoogleMark from "@/src/components/auth/GoogleMark";
import SignupAddressField, { type SignupAddress } from "@/src/components/auth/SignupAddressField";
import PhoneVerificationField from "@/src/components/auth/PhoneVerificationField";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingToken = searchParams.get("pending");
  const oauthProvider = searchParams.get("oauth");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [signupMode, setSignupMode] = useState<"methods" | "email">("methods");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [shippingAddress, setShippingAddress] = useState<SignupAddress>({ zonecode: "", address: "", addressDetail: "" });
  const [phone, setPhone] = useState("");
  const [phoneVerificationToken, setPhoneVerificationToken] = useState<string | null>(null);
  const onPhoneVerified = useCallback((verifiedPhone: string | null, token: string | null) => {
    setPhone(verifiedPhone ?? "");
    setPhoneVerificationToken(token);
  }, []);
  const [loading, setLoading] = useState<"google" | "naver" | "form" | null>(null);
  const [message, setMessage] = useState("");
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());
  const validPassword = password.length >= 8;
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const normalizedPhone = phone.replace(/\D/g, "");
  const validPhone = /^01[016789]\d{7,8}$/.test(normalizedPhone);
  const effectiveRecipientName = recipientName.trim() || name.trim();
  const shippingReady = Boolean(effectiveRecipientName && shippingAddress.zonecode && shippingAddress.address);
  const readyForSignup = Boolean(terms && privacy && validPhone && phoneVerificationToken && shippingReady && (pendingToken || (name.trim() && validEmail && validPassword && passwordsMatch)));

  const oauth = async (provider: "google" | "naver") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/" });
  };

  const register = async () => {
    setMessage("");
    if (!terms || !privacy) return setMessage("이용약관과 개인정보 수집·이용에 동의해주세요.");
    if (!validPhone) return setMessage("휴대전화번호를 확인해주세요.");
    if (!phoneVerificationToken) return setMessage("휴대전화번호 인증을 완료해주세요.");
    if (pendingToken) {
      setLoading("form");
      try {
        const response = await fetch("/api/register/oauth", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ pendingToken, phone: normalizedPhone, phoneVerificationToken, recipientName: effectiveRecipientName, ...shippingAddress, termsAccepted: terms, privacyAccepted: privacy }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "가입에 실패했습니다.");
        router.replace("/");
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "가입에 실패했습니다.");
        setLoading(null);
      }
      return;
    }
    if (password !== passwordConfirm) return setMessage("비밀번호 확인이 일치하지 않습니다.");
    setLoading("form");
    try {
      const response = await fetch("/api/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, name, password, phone: normalizedPhone, phoneVerificationToken, recipientName: effectiveRecipientName, ...shippingAddress, termsAccepted: terms, privacyAccepted: privacy }) });
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
        <p className="text-body text-muted">{pendingToken ? `${oauthProvider === "naver" ? "네이버" : "Google"} 인증이 완료되었습니다. 배송 정보를 입력하면 가입이 완료됩니다.` : signupMode === "email" ? "이메일과 비밀번호로 가입 정보를 입력해주세요." : "원하는 방법을 선택해 회원가입을 진행해주세요."}</p>
        {(pendingToken || signupMode === "email") && <div className="border border-line bg-soft/30 p-4">
          <p className="text-util font-medium text-text">회원가입을 위해 아래 약관에 동의해주세요.</p>
          <div className="mt-3 space-y-3">
            <label className="flex gap-2 text-util"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" className="underline transition-colors hover:text-text">이용약관</Link> 동의 (필수)</span></label>
            <label className="flex gap-2 text-util"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> <span><Link href="/privacy" className="underline transition-colors hover:text-text">개인정보 수집·이용</Link> 동의 (필수, 휴대전화번호 포함)</span></label>
          </div>
        </div>}
        {!pendingToken && signupMode === "methods" && <div className="space-y-3">
          <button type="button" aria-label="Google로 가입" disabled={loading !== null} className="flex h-12 w-full items-center justify-center gap-2 border border-line text-nav transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:opacity-50" onClick={() => void oauth("google")}>{loading === "google" ? "Google 로그인으로 이동 중…" : <><GoogleMark className="h-5 w-5" /> Google로 가입</>}</button>
          <button type="button" aria-label="Naver로 가입" disabled={loading !== null} className="flex h-12 w-full items-center justify-center gap-2 bg-[#03c75a] text-nav font-semibold text-white transition-colors transition-transform hover:bg-[#02b653] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#03c75a] disabled:opacity-50" onClick={() => void oauth("naver")}><span className="font-bold">N</span> {loading === "naver" ? "네이버 로그인으로 이동 중…" : "네이버로 가입"}</button>
          <button type="button" className="h-12 w-full border border-line text-nav transition-colors transition-transform hover:bg-soft active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text" onClick={() => setSignupMode("email")}>이메일과 비밀번호로 가입</button>
        </div>}
        {!pendingToken && signupMode === "email" && <>
          <button type="button" className="text-util text-muted underline underline-offset-4" onClick={() => setSignupMode("methods")}>가입 방법 다시 선택</button>
          <div className="border-t border-line pt-4" />
          <label className="block text-util text-text">이름 <span className="text-red-600">(필수)</span><input required value={name} onChange={(e) => setName(e.target.value)} aria-invalid={Boolean(name && !name.trim())} className="mt-2 h-11 w-full border border-line px-3" placeholder="이름" autoComplete="name" /></label>
          {!name.trim() && <p className="-mt-3 text-util text-muted">가입할 이름을 입력해주세요.</p>}
          <label className="block text-util text-text">이메일 (아이디) <span className="text-red-600">(필수)</span><input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={Boolean(email && !validEmail)} className="mt-2 h-11 w-full border border-line px-3" placeholder="name@example.com" autoComplete="email" /></label>
          {email && !validEmail && <p className="-mt-3 text-util text-red-600">이메일 주소 형식을 확인해주세요. 예: name@example.com</p>}
          <label className="block text-util text-text">비밀번호 <span className="text-red-600">(필수)</span><input required value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} aria-invalid={Boolean(password && !validPassword)} className="mt-2 h-11 w-full border border-line px-3" placeholder="8자 이상" autoComplete="new-password" /></label>
          {password && !validPassword && <p className="-mt-3 text-util text-red-600">비밀번호를 {8 - password.length}자 더 입력해주세요. (8자 이상)</p>}
          <label className="block text-util text-text">비밀번호 확인 <span className="text-red-600">(필수)</span><input required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" aria-invalid={Boolean(passwordConfirm && !passwordsMatch)} className="mt-2 h-11 w-full border border-line px-3" autoComplete="new-password" placeholder="비밀번호를 한 번 더 입력해주세요" /></label>
          {passwordConfirm && !passwordsMatch && <p className="-mt-3 text-util text-red-600">비밀번호가 일치하지 않습니다.</p>}
        </>}
        {(pendingToken || signupMode === "email") && <>
          <label className="block text-util text-text">받는 분 <span className="text-red-600">(필수)</span><input required value={recipientName || name} onChange={(event) => setRecipientName(event.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder={pendingToken ? "배송받으실 분 이름" : "이름"} autoComplete="shipping name" /></label>
          {!effectiveRecipientName && <p className="-mt-3 text-util text-muted">기본 배송지의 받는 분 이름을 입력해주세요.</p>}
          <SignupAddressField value={shippingAddress} onChange={setShippingAddress} />
          {!shippingAddress.address && <p className="-mt-3 text-util text-muted">기본 배송지 주소를 검색해 선택해주세요.</p>}
          <PhoneVerificationField onVerified={onPhoneVerified} disabled={loading !== null} />
          {message && <p role="alert" className="text-util text-red-600">{message}</p>}
          <button type="button" disabled={loading !== null || !readyForSignup} aria-busy={loading === "form"} onClick={() => void register()} className="h-11 w-full bg-text text-nav font-medium text-bg transition-colors transition-transform hover:bg-[#444] active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text disabled:cursor-not-allowed disabled:opacity-40">{loading === "form" ? "가입 처리 중…" : "가입하기"}</button>
          <p className="text-util text-muted">모든 필수 항목을 입력하면 가입할 수 있어요. 오류가 생겨도 입력 내용은 유지됩니다.</p>
        </>}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense fallback={<div className="w-full px-3 pb-section pt-section" />}><SignupContent /></Suspense>;
}
