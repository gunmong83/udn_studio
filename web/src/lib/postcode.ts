export type PostcodeData = {
  address: string;
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  bname: string;
  apartment: string;
  userSelectedType?: "R" | "J";
};

type PostcodeConstructor = new (options: {
  oncomplete: (data: PostcodeData) => void;
  width?: string;
  height?: string;
}) => { embed: (element: HTMLElement) => void };

declare global {
  interface Window {
    daum?: { Postcode: PostcodeConstructor };
    kakao?: { Postcode?: PostcodeConstructor };
  }
}

let loading: Promise<PostcodeConstructor> | null = null;

export function loadPostcode(): Promise<PostcodeConstructor> {
  const existingConstructor = window.kakao?.Postcode ?? window.daum?.Postcode;
  if (existingConstructor) return Promise.resolve(existingConstructor);
  if (loading) return loading;

  loading = new Promise<PostcodeConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="postcode.v2.js"]');
    const script = existing ?? document.createElement("script");
    const finish = () => {
      cleanup();
      const constructor = window.kakao?.Postcode ?? window.daum?.Postcode;
      if (constructor) resolve(constructor);
      else fail();
    };
    const fail = () => {
      cleanup();
      script.remove();
      reject(new Error("주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."));
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      script.removeEventListener("load", finish);
      script.removeEventListener("error", fail);
    };
    const timer = window.setTimeout(fail, 12_000);
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    if (!existing) {
      script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    loading = null;
    throw error;
  });
  return loading;
}

export function formatPostcodeAddress(data: PostcodeData) {
  const isRoad = data.userSelectedType !== "J";
  const address = (isRoad ? data.roadAddress : data.jibunAddress) || data.address;
  const extras = isRoad ? [
    /[동로가]$/.test(data.bname) ? data.bname : "",
    data.buildingName && data.apartment === "Y" ? data.buildingName : "",
  ].filter(Boolean).join(", ") : "";
  return `${address}${extras ? ` (${extras})` : ""}`;
}
