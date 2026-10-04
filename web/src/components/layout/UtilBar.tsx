"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { clearCart, getCart, getCartOwner, replaceCart, setCartOwner, useCart, useWishlist } from "@/src/lib/store";
import { site } from "@/src/data/site";
import MegaDrawer from "./MegaDrawer";
import { useSession } from "next-auth/react";

// 유틸바 — mujagi #top_line 실측 (가이드 §4-3).
// 높이 52px · 배경 #f9f9f9 · 스크롤 시 유일하게 sticky(fixed 전환)되는 바.
// ☰ 좌측(32×52) + 로고 · 우측: 언어(한국어/English/日本語) + 아이콘군 30×30 ×4
// (검색·계정·위시리스트·장바구니) — 9항.
// 파동4 §①-1·판정서 관찰1 — 텍스트 링크 3건(로그인·스튜디오 소개·문의하기) 제거(가역):
// 전부 중복·dead(로그인=계정 아이콘 / 스튜디오 소개=ABOUT 메뉴 / 문의하기=href="#").
// 재활성화: 주석 처리된 LABELS·session 훅 복원 + import에 logout·useSession 재추가 +
// 우측 링크 블록(<div className="hidden items-center gap-3 sm:flex">…) 복원.
// ☰ 클릭 → 메가 드로어(호버 아님 — §4-4 실측). 뱃지는 radius 0 사각형(전역 원칙).

/* 파동4 가역 보존 — 유틸바 텍스트 링크 라벨 데이터(제거 항목 표시용이었음):
type LabelKey = "login" | "studio" | "contact" | "logout" | "greeting";

const LABELS: Record<Lang, Record<LabelKey, string>> = {
  ko: {
    login: "로그인",
    studio: "스튜디오 소개",
    contact: "문의하기",
    logout: "로그아웃",
    greeting: "반갑습니다",
  },
  en: {
    login: "Sign in",
    studio: "Our Studio",
    contact: "Contact",
    logout: "Sign out",
    greeting: "Welcome",
  },
  jp: {
    login: "ログイン",
    studio: "スタジオ紹介",
    contact: "お問い合わせ",
    logout: "ログアウト",
    greeting: "ようこそ",
  },
};
*/

function Badge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center bg-ink-strong px-1 text-[10px] leading-none text-bg">
      {n}
    </span>
  );
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
function IconUser({ filled }: { filled?: boolean }) {
  if (filled) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6Z" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function IconBag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function UtilBar() {
  // SessionProvider is unavailable during some static prerender passes
  // (notably not-found and generated product pages). Treat that pass as
  // signed out; the client hydrates with the real session afterward.
  const sessionState = useSession();
  const session = sessionState?.data ?? null;
  const previousUserId = useRef<string | null | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cartItems = useCart();
  const wishlist = useWishlist();
  const cart = cartItems.reduce((n, i) => n + i.qty, 0);
  const wish = wishlist.length;

  useEffect(() => {
    if (sessionState.status === "loading") return;
    const userId = session?.user?.id ?? null;
    const previous = previousUserId.current;
    previousUserId.current = userId;

    if (userId && previous !== userId) {
      const cartOwner = getCartOwner();
      // 같은 회원으로 새로고침한 경우에는 이미 DB 장바구니를 반영한 상태이므로
      // 현재 장바구니를 다시 merge하면 수량이 매번 누적됩니다.
      const guestCart = cartOwner === userId ? [] : getCart();
      if (cartOwner && cartOwner !== userId) clearCart();
      void fetch("/api/cart/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: guestCart }),
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (Array.isArray(data?.items)) {
            replaceCart(data.items.map((item: { productId: string; quantity: number }) => ({ slug: item.productId, qty: item.quantity })));
            setCartOwner(userId);
          }
        })
        .catch((error) => console.error("[cart-sync] 로그인 장바구니 동기화 실패", error));
    } else if (!userId && previous) {
      clearCart();
      setCartOwner(null);
    }
  }, [session?.user?.id, sessionState.status]);

  return (
    <>
      <div className="sticky top-0 z-40 bg-soft">
        <div className="flex h-[52px] items-center justify-between px-3 text-util text-text">
          {/* 좌측: ☰ 전체메뉴(클릭 → 391px 드로어) + 로고 워드마크 */}
          <div className="flex items-center">
            <button
              type="button"
              aria-label="전체 메뉴"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((v) => !v)}
              className="flex h-[52px] w-8 items-center justify-center"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <Link
              href="/"
              className="ml-2 text-util font-semibold tracking-wide text-text"
            >
              {site.name}
            </Link>
          </div>

          {/* 우측: 아이콘군 (검색 · 계정 · 위시리스트 · 장바구니) */}
          <div className="flex items-center gap-4">
            {/* 아이콘군 30×30 ×4 — 검색 · 계정 · 위시리스트 · 장바구니 */}
            <div className="flex items-center gap-1">
              <Link
                href="/search"
                aria-label="검색"
                className="relative flex h-[30px] w-[30px] items-center justify-center"
              >
                <IconSearch />
              </Link>
              <Link
                href="/mypage"
                aria-label={session?.user ? "마이페이지 (로그인됨)" : "계정"}
                className="relative flex h-[30px] w-[30px] items-center justify-center text-text transition-opacity hover:opacity-70"
              >
                <IconUser filled={Boolean(session?.user)} />
              </Link>
              <Link
                href="/wishlist"
                aria-label="위시리스트"
                className="relative flex h-[30px] w-[30px] items-center justify-center"
              >
                <IconHeart />
                <Badge n={wish} />
              </Link>
              <Link
                href="/cart"
                aria-label="장바구니"
                className="relative flex h-[30px] w-[30px] items-center justify-center"
              >
                <IconBag />
                <Badge n={cart} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <MegaDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
