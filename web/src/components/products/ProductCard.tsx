import Image from "@/src/components/ui/ProgressiveImage";
import Link from "next/link";
import type { Product } from "@/src/data/products";

// 상품 카드 — mujagi 목록 카드 실측 (가이드 §5-2·§9-6):
// 이미지 카드 비율(aspect-card 공용 토큰 — 파동5 §7 카드 축 3:4 확정) · 상품명 12px/600/#333 · 금액 12px/700/#333.
// 카테고리 라인·배경·보더 없음(mujagi 카드에는 없음 — 무색·무보더 유지).
// 가격 라벨("판매가")은 UDN 원문에 없어 생략 — 원문 표기 그대로.
// 이미지 hover 스케일 없음(§3 — 줌/트랜스폼 0건).
//
// 파동5 B1(§7 #4·#11 + 보강 muos4z6xg80x):
// - 카드 비율 = aspect-card 공용 토큰(globals.css 1곳 정의·**3:4 확정** — 2:3 심손실 vs 3:4 경미,
//   qa-visual 판독·달력 무해 이중 검증. 근거 docs/qa-visual/wave5-crop-observation.md §5~6).
// - object-position: 전 카드 기본 50% 50%·p3(the-tov)만 데이터 필드 "100% 50%"(워드마크 보존 특례).
// - href: kind 분기 — work → /portfolio/[slug]·product → /products/[slug](§4·§5 양쪽 상세 대응).

export default function ProductCard({ product }: { product: Product }) {
  const href =
    product.kind === "work"
      ? `/portfolio/${product.slug}`
      : `/products/${product.slug}`;
  const title =
    product.kind === "work" && !product.title.startsWith("[")
      ? `[ ${product.title} ]`
      : product.title;
  const displayTitle = product.listingTitle ?? title;
  const titleParts = product.kind === "product" ? displayTitle.split(/\s+(?=\[)/, 2) : [displayTitle];
  return (
    <Link href={href} className="block">
      <div
        className={`relative w-full overflow-hidden ${
          product.kind === "product" ? "aspect-[3959/2922] bg-soft" : "aspect-card"
        }`}
      >
        <Image
          src={product.listingImage ?? product.image}
          alt={title}
          fill
          sizes="238px"
          className="object-cover"
          style={
            product.objectPosition
              ? { objectPosition: product.objectPosition }
              : undefined
          }
        />
      </div>
      <div className="pt-2">
        <h3 className="text-body font-semibold leading-[18px] text-text">
          {titleParts.map((part, index) => (
            <span key={`${part}-${index}`} className={index > 0 ? "block" : undefined}>
              {part}
            </span>
          ))}
        </h3>
        {product.priceLabel && (
          <p className="mt-0.5 text-body font-bold leading-[18px] text-text">
            {product.displayPriceLabel ?? product.priceLabel}
          </p>
        )}
        {product.soldOut && <p className="text-util font-medium text-muted">SOLD OUT</p>}
      </div>
    </Link>
  );
}
