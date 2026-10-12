"use client";

import { useRef, useState } from "react";

type AddressData = {
  address: string;
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  bname: string;
  apartment: string;
};

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: AddressData) => void }) => { open: () => void };
    };
  }
}

export type SignupAddress = {
  zonecode: string;
  address: string;
  addressDetail: string;
};

type Props = {
  value: SignupAddress;
  onChange: (value: SignupAddress) => void;
};

export default function SignupAddressField({ value, onChange }: Props) {
  const detailRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const searchAddress = async () => {
    setError("");
    try {
      if (!window.daum?.Postcode) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector<HTMLScriptElement>('script[src*="postcode.v2.js"]');
          if (existing) {
            if (window.daum?.Postcode) return resolve();
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("주소 검색을 불러오지 못했습니다.")), { once: true });
            return;
          }
          const script = document.createElement("script");
          script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("주소 검색을 불러오지 못했습니다."));
          document.head.appendChild(script);
        });
      }
      if (!window.daum?.Postcode) throw new Error("주소 검색 서비스를 실행할 수 없습니다.");
      new window.daum.Postcode({
        oncomplete: (data) => {
          const extras = [
            /[동|로|가]$/.test(data.bname) ? data.bname : "",
            data.buildingName && data.apartment === "Y" ? data.buildingName : "",
          ].filter(Boolean).join(", ");
          onChange({
            ...value,
            zonecode: data.zonecode,
            address: `${data.roadAddress || data.jibunAddress}${extras ? ` (${extras})` : ""}`,
          });
          window.setTimeout(() => detailRef.current?.focus(), 100);
        },
      }).open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "주소 검색을 불러오지 못했습니다.");
    }
  };

  return (
    <fieldset className="space-y-3">
      <legend className="text-util font-medium text-text">기본 배송지 <span className="text-red-600">(필수)</span></legend>
      <div className="flex gap-2">
        <input readOnly value={value.zonecode} className="h-11 w-28 border border-line bg-soft px-3 text-body text-text" placeholder="우편번호" aria-label="우편번호" />
        <button type="button" onClick={() => void searchAddress()} className="h-11 border border-line px-4 text-util text-text transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text">주소 검색</button>
      </div>
      <label className="block text-util text-text">주소
        <input readOnly value={value.address} className="mt-1 h-11 w-full border border-line bg-soft px-3 text-body text-text" placeholder="주소 검색을 눌러 입력해주세요" />
      </label>
      <label className="block text-util text-text">상세 주소
        <input ref={detailRef} value={value.addressDetail} onChange={(event) => onChange({ ...value, addressDetail: event.target.value })} className="mt-1 h-11 w-full border border-line bg-bg px-3 text-body text-text outline-none focus:border-text" placeholder="동·호수 등 상세 주소" autoComplete="address-line2" />
      </label>
      <p className="text-util text-muted">가입 후 마이페이지에서 기본 배송지를 변경할 수 있어요.</p>
      {error && <p role="alert" className="text-util text-red-600">{error}</p>}
    </fieldset>
  );
}
