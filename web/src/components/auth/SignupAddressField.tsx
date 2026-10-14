"use client";

import { useRef, useState } from "react";
import PostcodeSearch from "@/src/components/orders/PostcodeSearch";
import { formatPostcodeAddress } from "@/src/lib/postcode";

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
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <fieldset className="space-y-3">
      <legend className="text-util font-medium text-text">기본 배송지 <span className="text-red-600">(필수)</span></legend>
      <div className="flex gap-2">
        <input readOnly value={value.zonecode} className="h-11 w-28 border border-line bg-soft px-3 text-body text-text" placeholder="우편번호" aria-label="우편번호" />
        <button type="button" onClick={() => setSearchOpen(true)} className="h-11 border border-line px-4 text-util text-text transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text">주소 검색</button>
      </div>
      {searchOpen && <PostcodeSearch onClose={() => setSearchOpen(false)} onSelect={(data) => {
        onChange({ ...value, zonecode: data.zonecode, address: formatPostcodeAddress(data) });
        setSearchOpen(false);
        window.setTimeout(() => detailRef.current?.focus(), 100);
      }} />}
      <label className="block text-util text-text">주소
        <input readOnly value={value.address} className="mt-1 h-11 w-full border border-line bg-soft px-3 text-body text-text" placeholder="주소 검색을 눌러 입력해주세요" />
      </label>
      <label className="block text-util text-text">상세 주소
        <input ref={detailRef} value={value.addressDetail} onChange={(event) => onChange({ ...value, addressDetail: event.target.value })} className="mt-1 h-11 w-full border border-line bg-bg px-3 text-body text-text outline-none focus:border-text" placeholder="동·호수 등 상세 주소" autoComplete="address-line2" />
      </label>
      <p className="text-util text-muted">가입 후 마이페이지에서 기본 배송지를 변경할 수 있어요.</p>
    </fieldset>
  );
}
