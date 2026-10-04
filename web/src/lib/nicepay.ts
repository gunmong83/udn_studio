export const NICEPAY_SCRIPT_URL = "https://pay.nicepay.co.kr/v1/js/";

export type NicePaymentMethod = "CARD" | "BANK";

export interface NicePaymentFields {
  clientId: string;
  method: "card" | "bank";
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  buyerName?: string;
  buyerTel?: string;
  buyerEmail?: string;
  returnCharSet?: "utf-8" | "euc-kr";
  fnError: (error: { errorMsg?: string; resultMsg?: string }) => void;
}

declare global {
  interface Window {
    AUTHNICE?: { requestPay: (fields: NicePaymentFields) => void };
  }
}

function loadNiceSdk() {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${NICEPAY_SCRIPT_URL}"]`);
    if (existing) {
      if (window.AUTHNICE) return resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("나이스페이 결제 모듈을 불러오지 못했습니다.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = NICEPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("나이스페이 결제 모듈을 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

export async function openNicePayment(fields: NicePaymentFields) {
  if (typeof window === "undefined") throw new Error("결제창은 브라우저에서만 열 수 있습니다.");
  if (!window.AUTHNICE) await loadNiceSdk();
  if (!window.AUTHNICE?.requestPay) throw new Error("나이스페이 결제 모듈이 준비되지 않았습니다.");
  window.AUTHNICE.requestPay({
    ...fields,
    fnError: fields.fnError ?? ((error) => {
      console.error("[nicepay] payment window error", error);
      window.alert(error?.errorMsg || error?.resultMsg || "결제창을 열지 못했습니다.");
    }),
  });
}
