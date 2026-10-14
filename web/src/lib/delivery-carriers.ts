// Shared by the admin editor, customer tracking links, and server validation.
export const DELIVERY_CARRIERS = [
  { name: "CJ대한통운", pattern: /^\d{12}$/, hint: "숫자 12자리", url: (n: string) => `https://www.cjlogistics.com/ko/tool/parcel/tracking?gnbInvcNo=${n}` },
  // Official usrtrc001k01.jsp form submits a GET to this action with sid1.
  { name: "우체국택배", pattern: /^\d{13}$/, hint: "숫자 13자리", url: (n: string) => `https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1=${encodeURIComponent(n)}` },
  { name: "한진택배", pattern: /^(\d{10}|\d{12})$/, hint: "숫자 10자리 또는 12자리", url: (n: string) => `https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&wblnum=${n}` },
  { name: "롯데택배", pattern: /^\d{12}$/, hint: "숫자 12자리", url: (n: string) => `https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo=${n}` },
  { name: "로젠택배", pattern: /^\d{11}$/, hint: "숫자 11자리", url: (n: string) => `https://www.ilogen.com/web/personal/trace/${n}` },
  { name: "경동택배", pattern: /^\d{9,16}$/, hint: "숫자 9~16자리", url: (n: string) => `https://kdexp.com/service/delivery/etc/delivery.do?barcode=${n}` },
  // The verified public tracking form requires entering the invoice manually.
  { name: "일양로지스", pattern: /^\d{9,11}$/, hint: "숫자 9~11자리", url: () => "https://www.ilyanglogis.com/functionality/tracking_eng.asp" },
] as const;

export function validateShipment(carrier: unknown, trackingNumber: unknown) {
  const selected = DELIVERY_CARRIERS.find((item) => item.name === String(carrier ?? "").trim());
  if (!selected) throw new Error("지원하는 택배사를 선택해주세요.");
  const raw = String(trackingNumber ?? "").trim();
  if (!raw) throw new Error("송장번호를 입력해주세요.");
  if (!/^[\d\s-]+$/.test(raw)) throw new Error("송장번호에는 숫자와 하이픈만 입력해주세요.");
  const number = raw.replace(/[\s-]/g, "");
  if (!selected.pattern.test(number) || /^0+$/.test(number)) {
    throw new Error(`${selected.name} 송장번호는 ${selected.hint}로 입력해주세요.`);
  }
  return { carrier: selected.name, trackingNumber: number, trackingUrl: selected.url(number) };
}

export function getTrackingUrl(carrier?: string | null, trackingNumber?: string | null): string | null {
  try {
    return validateShipment(carrier, trackingNumber).trackingUrl;
  } catch {
    return null;
  }
}
