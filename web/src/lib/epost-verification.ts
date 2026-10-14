import { validateShipment } from "@/src/lib/delivery-carriers";

export class EpostVerificationError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export type EpostTrackingStatus = {
  trackingNumber: string;
  deliveryStatus: string | null;
  deliveredAt: string | null;
  latestEvent: { date: string; time: string; location: string; status: string } | null;
};

function xmlValues(xml: string, tag: string): string[] {
  const values: string[] = [];
  const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi");
  for (const match of xml.matchAll(pattern)) {
    let value = match[1].trim();
    value = value.replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/, "$1");
    value = value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
    value = value.replace(/<[^>]*>/g, "").trim();
    if (value) values.push(value);
  }
  return values;
}

function apiError(message: string, status: number): EpostVerificationError {
  return new EpostVerificationError(message, status);
}

// Uses the service-key REST API documented by Korea Post. The specification lists
// HTTP as the service URL and does not mark transport encryption as supported.
export async function getEpostTrackingStatus(trackingNumber: string): Promise<EpostTrackingStatus> {
  const shipment = validateShipment("우체국택배", trackingNumber);
  const serviceKey = process.env.EPOST_SERVICE_KEY?.trim();
  if (!serviceKey) throw apiError("우체국 배송조회 API 키가 서버에 설정되지 않았습니다.", 503);

  const url = new URL("http://openapi.epost.go.kr/trace/retrieveLongitudinalService/retrieveLongitudinalService/getLongitudinalDomesticList");
  url.searchParams.set("rgist", shipment.trackingNumber);
  url.searchParams.set("serviceKey", serviceKey);

  try {
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/xml, text/xml" },
    });
    if (!response.ok) throw apiError("우체국 배송조회 API에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.", 503);
    const xml = await response.text();
    if (xml.length > 1_000_000 || !xml.includes("LongitudinalDomesticListResponse")) {
      throw apiError("우체국 배송조회 API 응답을 확인할 수 없습니다.", 503);
    }

    const returnCode = xmlValues(xml, "returnCode")[0] ?? "";
    const success = xmlValues(xml, "successYN")[0] ?? "";
    const responseNumber = xmlValues(xml, "rgist")[0] ?? "";
    const errorMessage = xmlValues(xml, "errMsg")[0] ?? "";

    if (returnCode === "03" && errorMessage.includes("조회결과가 없습니다")) {
      throw apiError("우체국 API에서 해당 송장번호의 배송정보를 찾지 못했습니다. 번호를 확인하고, 접수 직후라면 조회에 반영된 뒤 다시 시도해주세요.", 422);
    }
    if (success !== "Y" || returnCode !== "00" || responseNumber !== shipment.trackingNumber) {
      // Do not return the provider's raw message: it can contain request details.
      throw apiError("우체국 배송조회 API가 요청을 처리하지 못했습니다. 서버 키와 API 이용 승인을 확인해주세요.", 503);
    }

    const events = [...xml.matchAll(/<longitudinalDomesticList\b[^>]*>([\s\S]*?)<\/longitudinalDomesticList>/gi)]
      .map(([ , item ]) => ({
        date: xmlValues(item, "dlvyDate")[0] ?? "",
        time: xmlValues(item, "dlvyTime")[0] ?? "",
        location: xmlValues(item, "nowLc")[0] ?? "",
        status: xmlValues(item, "processSttus")[0] ?? "",
      }))
      .filter((event) => event.date || event.status);

    return {
      trackingNumber: shipment.trackingNumber,
      deliveryStatus: xmlValues(xml, "dlvySttus")[0] ?? null,
      deliveredAt: xmlValues(xml, "dlvyDe")[0] || null,
      latestEvent: events.at(-1) ?? null,
    };
  } catch (error) {
    if (error instanceof EpostVerificationError) throw error;
    throw apiError("우체국 배송조회 API 연결이 지연되거나 실패했습니다. 저장 및 알림톡 발송은 하지 않았습니다. 잠시 후 다시 시도해주세요.", 503);
  }
}

export async function verifyEpostShipment(trackingNumber: string): Promise<void> {
  await getEpostTrackingStatus(trackingNumber);
}

export async function verifyEpostDelivered(trackingNumber: string): Promise<void> {
  const result = await getEpostTrackingStatus(trackingNumber);
  if (result.deliveryStatus !== "배달완료") {
    const status = result.deliveryStatus || result.latestEvent?.status || "배송정보 확인 중";
    throw apiError(`우체국 API의 현재 배송 상태는 '${status}'입니다. 배달완료로 확인된 뒤 배송 완료로 저장할 수 있습니다.`, 409);
  }
}
