"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

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
        <p className="border border-line bg-soft px-3 py-3 text-util text-muted">휴대폰 인증은 서비스 운영 안정화 후 추가될 예정입니다. 현재는 선택 사항으로 받지 않습니다.</p>
        <label className="flex gap-2 text-util"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" className="underline">이용약관</Link> 동의 (필수)</span></label>
        <label className="flex gap-2 text-util"><input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} /> <span><Link href="/privacy" className="underline">개인정보 수집·이용</Link> 동의 (필수)</span></label>
        <button type="button" disabled={!terms || !privacy} className="h-11 w-full bg-text text-nav font-medium text-bg disabled:opacity-40">가입하기</button>
      </div>
    </div>
  );
}
