"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">회원가입</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        <p className="text-body text-muted">계정을 만들면 주문·배송 정보를 안전하게 관리할 수 있습니다.</p>
        <div className="flex gap-3">
          <button type="button" aria-label="Google로 가입" className="flex h-12 flex-1 items-center justify-center gap-2 border border-line text-nav" onClick={() => window.location.href = "/api/auth/signin/google?callbackUrl=/"}><span className="font-semibold">G</span> Google</button>
          <button type="button" aria-label="Naver로 가입" className="flex h-12 flex-1 items-center justify-center gap-2 bg-[#03c75a] text-nav font-semibold text-white" onClick={() => window.location.href = "/api/auth/signin/naver?callbackUrl=/"}><span>N</span> Naver</button>
        </div>
        <div className="border-t border-line pt-4" />
        <label className="block text-util text-text">아이디<input className="mt-2 h-11 w-full border border-line px-3" placeholder="영문·숫자 4자 이상" autoComplete="username" /></label>
        <label className="block text-util text-text">비밀번호<input type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder="8자 이상" autoComplete="new-password" /></label>
        <label className="block text-util text-text">비밀번호 확인<input type="password" className="mt-2 h-11 w-full border border-line px-3" autoComplete="new-password" /></label>
        <div className="flex items-end gap-2">
          <label className="block flex-1 text-util text-text">휴대폰 번호<input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 h-11 w-full border border-line px-3" placeholder="010-0000-0000" inputMode="tel" /></label>
          <button type="button" disabled={!phone || sent} onClick={() => setSent(true)} className="h-11 border border-line px-3 text-util disabled:opacity-40">{sent ? "발송됨" : "인증번호 받기"}</button>
        </div>
        {sent && <p className="text-util text-muted">인증번호가 발송되었습니다. (실제 SMS/알림톡 발송은 인증 서비스 키 연결 후 활성화됩니다.)</p>}
        <label className="flex gap-2 text-util"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" className="underline">이용약관</Link> 동의 (필수)</span></label>
        <label className="flex gap-2 text-util"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> <span><Link href="/privacy" className="underline">개인정보 수집·이용</Link> 동의 (필수)</span></label>
        <button type="button" disabled={!terms || !privacy || !sent} className="h-11 w-full bg-text text-nav font-medium text-bg disabled:opacity-40">가입하기</button>
      </div>
    </div>
  );
}
