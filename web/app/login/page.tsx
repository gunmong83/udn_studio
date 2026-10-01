"use client";

import { useState } from "react";
import { login, logout, useSession } from "@/src/lib/store";

// 로그인 — UI만(폼 + localStorage 가짜 세션). 실제 인증 없음(지시서 MUST NOT).
// mujagi 버튼 문법(§5-3): 제출 = 잉크 반전(bg #333·text #fff·1px #333·radius 0),
// 로그아웃 = btnNormal(1px #e8e8e8·hover #f9f9f9). accent 미사용(GIFTING 전용).

export default function LoginPage() {
  const session = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="w-full px-3 pb-section pt-section">
      <h1 className="text-label font-bold text-text">LOGIN</h1>
      {session ? (
        <div className="mt-4 max-w-[400px] space-y-4">
          <p className="text-body text-muted">
            로그인되어 있습니다(가짜 세션 — 실제 인증 아님).
          </p>
          <p className="text-body font-semibold text-text">
            {session.name} · {session.email}
          </p>
          <button
            type="button"
            onClick={() => logout()}
            className="h-10 w-full border border-line text-nav text-text hover:bg-soft"
          >
            로그아웃
          </button>
        </div>
      ) : (
        <form
          className="mt-4 max-w-[400px] space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && email.trim()) {
              login(name.trim(), email.trim());
            }
          }}
        >
          <label className="block">
            <span className="mb-1 block text-util text-muted">이름</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-line px-3 py-2.5 text-body text-text outline-none focus:border-line-strong"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-util text-muted">이메일</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-line px-3 py-2.5 text-body text-text outline-none focus:border-line-strong"
            />
          </label>
          <button
            type="submit"
            className="h-10 w-full border border-line-strong bg-text text-nav font-medium text-bg"
          >
            로그인
          </button>
          <p className="text-util text-muted">
            실제 인증이 없는 목업입니다 — 입력값은 브라우저 localStorage에만
            저장됩니다.
          </p>
        </form>
      )}
    </div>
  );
}
