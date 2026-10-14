"use client";

import { useEffect, useRef, useState } from "react";
import { loadPostcode, type PostcodeData } from "@/src/lib/postcode";

export default function PostcodeSearch({ onSelect, onClose }: {
  onSelect: (data: PostcodeData) => void;
  onClose: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  useEffect(() => {
    let cancelled = false;
    const element = host.current;
    loadPostcode().then((Postcode) => {
      if (cancelled || !element) return;
      // Webviews may not support window.open. Embed the official service in
      // the current page so address selection needs no browser popup.
      new Postcode({ width: "100%", height: "100%", oncomplete: (data) => {
        if (!cancelled) onSelectRef.current(data);
      } }).embed(element);
      setLoading(false);
    }).catch((cause) => {
      if (!cancelled) { setError(cause instanceof Error ? cause.message : "주소 검색 로드 실패"); setLoading(false); }
    });
    return () => { cancelled = true; element?.replaceChildren(); };
  }, []);

  return <section aria-label="주소 검색" className="mt-3 overflow-hidden border border-line bg-bg">
    <div className="flex items-center justify-between border-b border-line px-3 py-2">
      <p className="text-util font-medium text-text">주소 검색</p>
      <button type="button" onClick={onClose} className="px-2 py-1 text-util text-text" aria-label="주소 검색 닫기">닫기</button>
    </div>
    {loading && <p role="status" className="p-3 text-util text-muted">주소 검색을 불러오는 중…</p>}
    {error && <p role="alert" className="p-3 text-util text-red-600">{error}</p>}
    <div ref={host} className={error ? "hidden" : "h-[440px] w-full"} />
  </section>;
}
