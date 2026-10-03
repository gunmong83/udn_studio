"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">LOGIN</h1>
      <div className="mx-auto mt-8 max-w-[420px] space-y-4">
        {loading ? <p className="text-body text-muted">로그인 상태를 확인하고 있습니다.</p> : session?.user ? (
          <>
            <p className="text-body text-muted">로그인되어 있습니다.</p>
            <p className="text-body font-semibold text-text">{session.user.name ?? "회원"} · {session.user.email}</p>
            {session.user.role === "admin" && <p className="text-util text-muted">관리자 계정</p>}
            <button type="button" onClick={() => signOut({ callbackUrl: "/" })} className="h-10 w-full border border-line text-nav text-text hover:bg-soft">로그아웃</button>
          </>
        ) : (
          <>
            <label className="block text-util text-text">아이디<input className="mt-2 h-11 w-full border border-line px-3" placeholder="아이디를 입력해주세요" autoComplete="username" /></label>
            <label className="block text-util text-text">비밀번호<input type="password" className="mt-2 h-11 w-full border border-line px-3" placeholder="비밀번호를 입력해주세요" autoComplete="current-password" /></label>
            <button type="button" className="h-11 w-full bg-text text-nav font-medium text-bg">로그인</button>
            <Link href="/signup" className="block h-11 w-full border border-line text-center leading-[44px] text-nav text-text">회원가입</Link>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button type="button" aria-label="Google로 로그인" onClick={() => signIn("google", { callbackUrl: "/" })} className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-lg font-semibold">G</button>
              <button type="button" aria-label="Naver로 로그인" onClick={() => signIn("naver", { callbackUrl: "/" })} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03c75a] text-lg font-bold text-white">N</button>
            </div>
            <label className="flex items-start gap-2 pt-2 text-util text-muted"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />로그인 및 회원가입 시 <Link href="/terms" className="underline">이용약관</Link>과 <Link href="/privacy" className="underline">개인정보처리방침</Link>에 동의합니다.</label>
          </>
        )}
      </div>
    </div>
  );
}
