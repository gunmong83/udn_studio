"use client";

import Image from "@/src/components/ui/ProgressiveImage";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { products } from "@/src/data/products";

// 랜딩에서는 판매 상품만 순환한다. 옵션 상품은 대표 옵션 한 장으로 묶어
// 같은 상품이 반복 노출되지 않도록 한다.
const productSlides = ["ryeong-2027", "udn-calendar-2026", "rok-masking-tape-green", "che-postcard-2026", "buhm-postcard-2026"]
  .map((slug) => products.find((item) => item.slug === slug))
  .filter((item): item is (typeof products)[number] => Boolean(item));
const slides = [
  ...productSlides.map((item) => ({
    image: item.listingImage ?? item.image,
    alt: item.title,
    href: `/products/${item.slug}`,
    title: item.listingTitle ?? item.title,
    category: item.category,
  })),
  {
    image: "/assets/landing/udn-calendar-2026-back.jpg",
    alt: "2027년 달력 패키지 이미지",
    href: "/products/ryeong-2027",
    title: "UDN Calendar 2027 Food in Season [令 Ryung]",
    category: "Calendar",
  },
];
const AUTO_INTERVAL_MS = 5000;
const FADE_MS = 600;
const SWIPE_THRESHOLD_PX = 40;
export default function ProductSlideshow() {
  const [index, setIndex] = useState(0);
  const startX = useRef<number | null>(null);

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
      <Link href={active.href} className="block" aria-label={`${active.title} 상세 보기`}>
        <div
          className="relative aspect-[3959/2922] w-full touch-pan-y overflow-hidden bg-soft"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (startX.current = null)}
        >
          {slides.map((slide, slideIndex) => (
            <Image
              key={slide.image}
              src={slide.image}
              alt={slide.alt}
              fill
              sizes="726px"
              style={{ transitionDuration: `${FADE_MS}ms` }}
              className={`pointer-events-none object-cover transition-opacity ${slideIndex === index ? "opacity-100" : "opacity-0"}`}
            />
          ))}
        </div>
        <div className="pt-3">
        <p className="text-nav font-medium text-ink-strong">{active.category}</p>
          <h3 className="overflow-hidden text-ellipsis whitespace-nowrap text-nav font-medium leading-5 text-ink-strong sm:text-heading">
            {active.title}
          </h3>
          <p className="mt-2 text-nav text-ink-strong">Read More →</p>
        </div>
      </Link>
    </section>
  );
}
