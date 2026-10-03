"use client";

import { useSyncExternalStore } from "react";

// localStorage 기반 mock 저장소(장바구니·위시리스트·가짜 세션·언어).
// 실제 인증·결제 연동 없음(지시서 MUST NOT).
// 읽기 훅은 useSyncExternalStore 로 구현한다 — 서버 snapshot 과 클라이언트
// snapshot을 React가 자동 구분해 하이드레이션 미스매치와 effect 내 setState
// (react-hooks/set-state-in-effect)를 만들지 않는다.

export interface CartItem {
  slug: string;
  qty: number;
}

export interface Session {
  name: string;
  email: string;
}

export type Lang = "ko" | "en" | "jp";

const CART_KEY = "udn-cart";
const WISH_KEY = "udn-wishlist";
const SESSION_KEY = "udn-session";
const LANG_KEY = "udn-lang";

export const CART_EVENT = "udn:cart";
export const WISH_EVENT = "udn:wishlist";
export const SESSION_EVENT = "udn:session";
const LANG_EVENT = "udn:lang";

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown, eventName: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(eventName));
}

/* ---------- 명령형 읽기(이벤트 핸들러 등 비-렌더 컨텍스트용) ---------- */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  return parseJSON(window.localStorage.getItem(key), fallback);
}

export function getCart(): CartItem[] {
  return read<CartItem[]>(CART_KEY, []);
}

export function getWishlist(): string[] {
  return read<string[]>(WISH_KEY, []);
}

export function isInWishlist(slug: string): boolean {
  return getWishlist().includes(slug);
}

export function getSession(): Session | null {
  return read<Session | null>(SESSION_KEY, null);
}

export function getLang(): Lang {
  return read<Lang>(LANG_KEY, "ko");
}

/* ---------- 쓰기(변경 시 커스텀 이벤트 발행 → 구독 훅 갱신) ---------- */

export function addToCart(slug: string, qty = 1): void {
  const cart = getCart();
  const found = cart.find((i) => i.slug === slug);
  if (found) found.qty += qty;
  else cart.push({ slug, qty });
  write(CART_KEY, cart, CART_EVENT);
}

export function setCartQty(slug: string, qty: number): void {
  let cart = getCart();
  if (qty <= 0) cart = cart.filter((i) => i.slug !== slug);
  else cart = cart.map((i) => (i.slug === slug ? { ...i, qty } : i));
  write(CART_KEY, cart, CART_EVENT);
}

export function removeFromCart(slug: string): void {
  write(
    CART_KEY,
    getCart().filter((i) => i.slug !== slug),
    CART_EVENT,
  );
}

export function clearCart(): void {
  write(CART_KEY, [], CART_EVENT);
}

/** 토글 후 위시 상태를 반환 */
export function toggleWishlist(slug: string): boolean {
  const list = getWishlist();
  const next = list.includes(slug)
    ? list.filter((s) => s !== slug)
    : [...list, slug];
  write(WISH_KEY, next, WISH_EVENT);
  return next.includes(slug);
}

export function login(name: string, email: string): void {
  write(SESSION_KEY, { name, email }, SESSION_EVENT);
}

export function logout(): void {
  write(SESSION_KEY, null, SESSION_EVENT);
}

export function setLang(lang: Lang): void {
  write(LANG_KEY, lang, LANG_EVENT);
}

/* ---------- 구독 훅(렌더 컨텍스트용 — useSyncExternalStore) ---------- */

interface LocalStore<T> {
  subscribe(callback: () => void): () => void;
  getSnapshot(): T;
  getServerSnapshot(): T;
}

// snapshot 캐시: localStorage 원시 문자열이 같으면 파싱 결과 재사용 —
// useSyncExternalStore 가 snapshot 식별 불안정으로 무한 렌더하는 것을 막는다.
function createLocalStore<T>(
  key: string,
  events: string[],
  fallback: T,
): LocalStore<T> {
  let cache: { raw: string | null; value: T } | null = null;
  return {
    subscribe(callback) {
      if (typeof window === "undefined") return () => {};
      const handler = () => callback();
      events.forEach((e) => window.addEventListener(e, handler));
      // 다른 탭에서의 변경(storage)도 반영
      window.addEventListener("storage", handler);
      return () => {
        events.forEach((e) => window.removeEventListener(e, handler));
        window.removeEventListener("storage", handler);
      };
    },
    getSnapshot() {
      const raw = window.localStorage.getItem(key);
      if (!cache || cache.raw !== raw) {
        cache = { raw, value: parseJSON(raw, fallback) };
      }
      return cache.value;
    },
    getServerSnapshot() {
      return fallback;
    },
  };
}

const cartStore = createLocalStore<CartItem[]>(CART_KEY, [CART_EVENT], []);
const wishStore = createLocalStore<string[]>(WISH_KEY, [WISH_EVENT], []);
const sessionStore = createLocalStore<Session | null>(
  SESSION_KEY,
  [SESSION_EVENT],
  null,
);
const langStore = createLocalStore<Lang>(LANG_KEY, [LANG_EVENT], "ko");

export function useCart(): CartItem[] {
  return useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
}

export function useWishlist(): string[] {
  return useSyncExternalStore(
    wishStore.subscribe,
    wishStore.getSnapshot,
    wishStore.getServerSnapshot,
  );
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    sessionStore.subscribe,
    sessionStore.getSnapshot,
    sessionStore.getServerSnapshot,
  );
}

export function useLang(): Lang {
  return useSyncExternalStore(
    langStore.subscribe,
    langStore.getSnapshot,
    langStore.getServerSnapshot,
  );
}
