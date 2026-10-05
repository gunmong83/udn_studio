import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getWorks, getProduct } from "@/src/data/products";

export function generateStaticParams() {
  return getWorks().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return {
    title: product ? product.title : "PORTFOLIO",
    robots: { index: false, follow: true },
  };
}

// 포트폴리오 작품 상세(파동5 B1·§4·§7 #7 — muos3okq61ob) — products/[slug] 구조 재사용:
// - 브레드크럼 PORTFOLIO / {category}(12px/400/#999·line-height 30px — products 상세 문법)
// - 대표 이미지 **원본 비율 전폡 무크롭**(§7 상세 축 — style aspectRatio·데이터 aspect 필드.
//   컨테이너 비율 = 원본 비율 → 크롭 0%)
// - 원문 description 문자 일치(카피 0자 수정 — 트레일링 스페이스·이중 공백 보존)
// - detailImageAssets 원본 전폡 스택(NeRyGe 4종 — mt-section 리듬·§6 본문 이미지 문법)
// - 가격/구매 CTA 없음(작품 — ProductActions 미렌더·§4 "가격/CTA 없음")
// 원문에 설명 없는 항목은 설명란을 렌더하지 않는다 — 지어내지 않음(works 6종 전부 설명 보유).
export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product || product.kind !== "work") notFound();

  return (
    <div className="w-full pb-section">
      <nav className="px-3 pt-section text-body leading-[30px] text-muted">
        <Link href="/portfolio" className="hover:text-text">
          PORTFOLIO
        </Link>
        <span className="mx-2">/</span>
        <span>{product.category}</span>
      </nav>

      {/* 대표 이미지 — 원본 비율 전폡(§7 상세 축·무크롭) */}
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: product.aspect }}
      >
        <Image
          src={product.image}
          alt={product.title}
          fill
          priority
          sizes="750px"
          className="object-cover"
        />
      </div>

      <div className="px-3 pt-4">
        <h1 className="text-drawer font-bold text-text">{product.title}</h1>
        {product.description && (
          <p className="mt-4 text-body leading-[21.6px] text-text">
            {product.description}
          </p>
        )}
        {/* 가격·구매 CTA 없음 — 작품(§4·ProductActions 미렌더) */}
      </div>

      {/* 본문 이미지 — 원본 비율 전폡 스택(NeRyGe 4종·§7 상세 축 — B2 통합 스키마 detailImages) */}
      {product.detailImages?.map((d) => (
        <div
          key={d.src}
          className="relative mt-section w-full overflow-hidden"
          style={{ aspectRatio: d.aspect }}
        >
          <Image
            src={d.src}
            alt={`${product.title} detail`}
            fill
            sizes="750px"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}
