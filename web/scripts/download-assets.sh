#!/usr/bin/env bash
# UDN(studioundesignated.com) 공개 자산 다운로드 → site/public/assets/
# 원본 /assets/ URL 구조를 그대로 미러링(파동2 상세 페이지 자산 경로 호환).
# 1차: _next/image 최적화 URL(w=3840/1920, q=75) / 2차: 깨졌으면 /assets/<경로> 직접 fetch
# 검증: 크기 > 1000B + file 타입이 이미지
set -u
BASE="https://studioundesignated.com"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/assets"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"

download() {
  local path="$1" w="$2"
  local enc; enc="/assets/$path"; enc="${enc//\//%2F}"
  local out="$DEST/$path"
  mkdir -p "$(dirname "$out")"
  curl -sSL -A "$UA" --max-time 180 "$BASE/_next/image?url=$enc&w=$w&q=75" -o "$out"
  if ! file "$out" | grep -qiE 'JPEG|PNG|WebP|image'; then
    echo "RETRY(direct): $path"
    curl -sSL -A "$UA" --max-time 180 "$BASE/assets/$path" -o "$out"
  fi
  local sz ft
  sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
  ft=$(file -b "$out")
  if [ "$sz" -gt 1000 ] && echo "$ft" | grep -qiE 'JPEG|PNG|WebP|image'; then
    echo "OK   $path  ${sz}B  $ft"
    return 0
  else
    echo "FAIL $path  ${sz}B  $ft"
    return 1
  fi
}

fail=0
# 히어로 배경·인트로듀스·홈맵 — w=3840 (원본 홈 srcSet 2x 기준)
download "main_background.png" 3840 || fail=$((fail+1))
for i in 1 2 3 4 5; do download "introduce_images/introduce_$i.jpg" 3840 || fail=$((fail+1)); done
download "introduce_images/homepage_map.png" 3840 || fail=$((fail+1))
# 포트폴리오 — w=1920 (원본 포트폴리오 카드 srcSet 2x 기준)
download "portfolio_images/portfolio_1.png" 1920 || fail=$((fail+1))
for i in 2 3 4 5 6 7; do download "portfolio_images/portfolio_$i.jpg" 1920 || fail=$((fail+1)); done
# NeRyGe 상세 이미지 4장 — /products/[slug] 상세 페이지용(원본 모달 실측, 태스크 14장 외 추가)
for f in 1.jpeg 2.jpg 3.jpeg 4.jpeg; do download "portfolio_images/portfolio_2/$f" 1920 || fail=$((fail+1)); done
# 파비콘(UDN 공개 자산 — 홈 목업 충실도용, 태스크 14장 외 추가)
mkdir -p "$DEST"
curl -sSL -A "$UA" --max-time 60 "$BASE/assets/UDN_logo_favicon.svg" -o "$DEST/UDN_logo_favicon.svg"
echo "OK   UDN_logo_favicon.svg  $(stat -c%s "$DEST/UDN_logo_favicon.svg" 2>/dev/null)B  $(file -b "$DEST/UDN_logo_favicon.svg")"
echo "----"
echo "FAILED_COUNT=$fail"
exit $fail
