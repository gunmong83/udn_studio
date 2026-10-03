import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, products } from "@/src/data/products";
import ProductActions from "@/src/components/products/ProductActions";
import { auth } from "@/src/auth";

export function generateStaticParams() {
  return products.filter((p) => !p.adminOnly).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  return { title: product ? product.title : "PRODUCTS" };
}

// 상품 상세 — mujagi 상세 실측 (가이드 §2-2·§5-3·§6):
// - 브레드크럼 12px/400/#999, line-height 30px
// - 상품명 h1 15px/700/#333(§2-2) · 금액 12px/700
// 원문에 설명 없는 항목(Calendar)은 설명란을 렌더하지 않는다 — 지어내지 않음.
//
// 파동5 B2(§3·§7 #5·#6 — muosdkwtl1yu ②):
// - 대표 이미지 **원본 비율 전폡 무크롭**(§7 상세 축 — 데이터 aspect 필드·style aspectRatio.
//   파동4 aspect-square 1:1 폐지 — 컨테이너 비율=원본 비율 → 크롭 0%)
// - 구매 CTA **accent 이동**(§1 — GIFTING 폐지로 mj-red=구매 버튼 대응·337×40
//   bg-accent text-white radius 0·스마트스토어 새 탭)
// - 작가노트 원문 전문 배치(검수 승인 ② — 발췌는 지어내기·원문 전체. 문단 leading 21.6px·
//   mt-2 리듬 — 스타일만·텍스트 무변경)
// - detailImages 원본 비율 전폡 스택(§7 — per-asset {src, aspect})
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  if (product.adminOnly) {
    const session = await auth();
    if (session?.user?.role !== "admin") notFound();
  }

  return (
    <div className="w-full pb-section">
      <nav className="px-3 pt-section text-body leading-[30px] text-muted">
        <Link href="/products" className="hover:text-text">
          PRODUCTS
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
        {product.priceLabel && (
          <p className="mt-3 text-body font-bold text-text">
            {product.priceLabel}
          </p>
        )}
        {product.description && (
          <p className="mt-4 text-body leading-[21.6px] text-text">
            {product.description}
          </p>
        )}
        <ProductActions product={product} accent />
      </div>

      {/* 작가노트 원문 전문(§3 — 검수 승인 ②·원문 그대로 재작성 0) */}
      {product.artistNote && (
        <div className="px-3 pt-section">
          {product.artistNote.split("\n\n").map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? "text-body leading-[21.6px] text-text"
                  : "mt-2 text-body leading-[21.6px] text-text"
              }
            >
              {para}
            </p>
          ))}
        </div>
      )}

      {/* 본문 이미지 — 원본 비율 전폡 스택(§7 #6 — per-asset aspect·무크롭) */}
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
