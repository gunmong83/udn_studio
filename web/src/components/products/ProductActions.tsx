"use client";

import { useState } from "react";
import type { Product } from "@/src/data/products";
import { toggleWishlist, useWishlist } from "@/src/lib/store";

const NAVER_ICON_PATH =
  "M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845Z";

export default function ProductActions({
  product,
}: {
  product: Product;
  accent?: boolean;
}) {
  const wishlist = useWishlist();
  const wished = wishlist.includes(product.slug);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData = {
      title: product.title,
      text: `${product.title} - Studio Undesignated`,
      url: shareUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // 취소하거나 에러 발생 시 클립보드 복사로 대체
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // 복사 실패 시 fallback
      }
    }
  };

  return (
    <div className="mt-6">
      {/* 유틸 아이콘 버튼 행 (위시리스트 + 공유 + 네이버 스마트스토어) */}
      <div className="mt-3 flex items-center gap-2">
        {/* 관심상품(위시리스트) */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label={wished ? "위시리스트에서 제거" : "위시리스트에 추가"}
          aria-pressed={wished}
          title={wished ? "위시리스트에서 제거" : "위시리스트에 추가"}
          className="flex h-10 w-10 items-center justify-center border border-line-strong bg-bg text-text transition-colors hover:bg-soft"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill={wished ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* SNS / 링크 공유 */}
        <button
          type="button"
          onClick={handleShare}
          aria-label="공유하기 또는 링크 복사"
          title="공유하기 또는 링크 복사"
          className="flex h-10 w-10 items-center justify-center border border-line-strong bg-bg text-text transition-colors hover:bg-soft"
        >
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>

        {/* 네이버 스마트스토어 바로가기 */}
        {product.link && (
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="네이버 스마트스토어로 이동"
            title="네이버 스마트스토어로 이동"
            className="flex h-10 w-10 items-center justify-center border border-line-strong bg-bg text-text transition-colors hover:bg-soft"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              focusable="false"
            >
              <path d={NAVER_ICON_PATH} />
            </svg>
          </a>
        )}

        {/* 링크 복사 안내 토스트 */}
        {copied && (
          <span className="ml-1 text-util font-medium text-emerald-600 transition-opacity">
            링크가 복사되었습니다! ✓
          </span>
        )}
      </div>
    </div>
  );
}
