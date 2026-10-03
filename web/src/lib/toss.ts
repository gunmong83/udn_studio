export interface TossPaymentRequestOptions {
  method?: string; // 기본값 '카드'
  amount: number;
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  successUrl: string;
  failUrl: string;
}

export interface TossPaymentsInstance {
  requestPayment: (method: string, options: Record<string, unknown>) => Promise<void>;
}

export type TossPaymentsFactory = (clientKey: string) => TossPaymentsInstance;

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

/**
 * 토스페이먼츠 결제창 SDK 스크립트를 동적으로 로드합니다.
 */
export async function loadTossPaymentsSDK(): Promise<TossPaymentsFactory> {
  if (typeof window === "undefined") {
    throw new Error("TossPayments SDK는 브라우저 환경에서만 로드할 수 있습니다.");
  }

  if (window.TossPayments) {
    return window.TossPayments;
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://js.tosspayments.com/v1/payment"]');
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.TossPayments) resolve(window.TossPayments);
        else reject(new Error("토스페이먼츠 SDK 초기화 실패"));
      });
      existing.addEventListener("error", () => reject(new Error("토스페이먼츠 스크립트 로드 실패")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v1/payment";
    script.async = true;
    script.onload = () => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
      } else {
        reject(new Error("토스페이먼츠 SDK를 초기화할 수 없습니다."));
      }
    };
    script.onerror = () => reject(new Error("토스페이먼츠 스크립트를 불러오지 못했습니다."));
    document.head.appendChild(script);
  });
}

/**
 * 토스 결제창을 호출합니다.
 */
export async function requestTossPayment(options: TossPaymentRequestOptions) {
  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
  if (!clientKey) throw new Error("결제 클라이언트 키가 설정되지 않았습니다.");
  const TossPayments = await loadTossPaymentsSDK();
  const tossPayments = TossPayments(clientKey);

  const { method = "카드", ...paymentOptions } = options;
  return tossPayments.requestPayment(method, paymentOptions);
}
