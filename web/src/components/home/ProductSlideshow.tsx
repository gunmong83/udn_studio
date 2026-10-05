"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { products } from "@/src/data/products";

// 랜딩에서는 판매 상품만 순환한다. 옵션 상품은 대표 옵션 한 장으로 묶어
// 같은 상품이 반복 노출되지 않도록 한다.
const slides = ["ryeong-2027", "udn-calendar-2026", "rok-masking-tape-green"]
  .map((slug) => products.find((item) => item.slug === slug))
  .filter((item): item is (typeof products)[number] => Boolean(item));
const AUTO_INTERVAL_MS = 5000;
const FADE_MS = 600;
const SWIPE_THRESHOLD_PX = 40;
const emptySubscribe = () => () => {};
const useIsHydrated = () => useSyncExternalStore(emptySubscribe, () => true, () => false);

export default function ProductSlideshow() {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);
  const mounted = useIsHydrated();

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setTimeout(
      () => setIndex((current) => (current + 1) % slides.length),
      AUTO_INTERVAL_MS,
    );
    return () => window.clearTimeout(timer);
  }, [index]);

  if (!slides.length) return null;
  const active = slides[index];

  const onPointerDown = (event: React.PointerEvent) => {
    startX.current = event.clientX;
  };
  const onPointerUp = (event: React.PointerEvent) => {
    if (startX.current === null || slides.length < 2) return;
    const delta = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;
    setIndex((current) =>
      delta < 0
        ? (current + 1) % slides.length
        : (current + slides.length - 1) % slides.length,
    );
  };

  return (
    <section className="w-full px-3 pt-section" aria-labelledby="products-heading">
      <div className="mb-3 flex items-end justify-between">
        <h2 id="products-heading" className="text-label font-bold text-text">PRODUCTS</h2>
        <Link href="/products" className="text-cta text-muted hover:text-text">모두 보기 →</Link>
      </div>
      <Link href={`/products/${active.slug}`} className="block" aria-label={`${active.title} 상세 보기`}>
        <div
          className="relative aspect-square w-full touch-pan-y overflow-hidden bg-soft"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (startX.current = null)}
        >
          {slides.map((slide, slideIndex) => (
            <Image
              key={slide.slug}
              src={slide.listingImage ?? slide.image}
              alt={slide.title}
              fill
              sizes="726px"
              style={{ transitionDuration: `${FADE_MS}ms`, objectPosition: slide.objectPosition }}
              className={`pointer-events-none object-contain transition-opacity ${slideIndex === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-[rgba(255,255,255,0.3)]">
            {mounted && (
              <div key={index} className="h-full w-full origin-left bg-white" style={{ animation: `product-progress ${AUTO_INTERVAL_MS}ms linear forwards` }} />
            )}
          </div>
        </div>
        <div className="pt-3">
          <p className="text-nav font-medium text-ink-strong">{active.category}</p>
          <h3 className="text-heading font-medium text-ink-strong">{active.listingTitle ?? active.title}</h3>
          <p className="mt-2 text-nav text-ink-strong">Read More →</p>
        </div>
      </Link>
      <style>{`@keyframes product-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }`}</style>
    </section>
  );
}
