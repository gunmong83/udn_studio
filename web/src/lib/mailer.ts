import "server-only";
import nodemailer from "nodemailer";
import { ADMIN_EMAIL } from "@/src/lib/admin";

export type OrderEmailItem = {
  productId?: string;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type OrderEmailData = {
  id: string;
  totalAmount: number;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail?: string | null;
  paymentKey?: string | null;
  paymentStatus?: string;
  status?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  cancelReason?: string | null;
  user?: {
    email?: string | null;
    name?: string | null;
  } | null;
  items: OrderEmailItem[];
};

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) return null;

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: Number(process.env.SMTP_PORT ?? 465) === 465,
    auth: { user, pass: password },
  });
}

function formatKST(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function getSiteUrl(): string {
  const raw = process.env.AUTH_URL?.trim();
  if (!raw) return "https://studioundesignated.com";
  return raw.replace(/\/+$/, "");
}

function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendPaymentAdminEmail(order: OrderEmailData): Promise<void> {
  const to = process.env.ADMIN_EMAIL ?? ADMIN_EMAIL ?? "studioudn@naver.com";
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "studioudn@naver.com";
  const transporter = createTransporter();
  if (!transporter || !to || !from) return;

  const fullAddress = [order.address, order.addressDetail].filter(Boolean).join(" ");
  const siteUrl = getSiteUrl();
  const adminUrl = `${siteUrl}/admin`;
  const formattedDate = formatKST(order.createdAt);
  const formattedAmount = `${order.totalAmount.toLocaleString("ko-KR")}원`;

  const textItemLines = order.items.length
    ? order.items
        .map(
          (item) =>
            `- ${item.title} × ${item.quantity}개 (${(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원 / 단가 ${item.unitPrice.toLocaleString("ko-KR")}원)`
        )
        .join("\n")
    : "- 상품 정보 없음";

  const htmlItemRows = order.items.length
    ? order.items
        .map(
          (item) => `
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 10px 12px; font-weight: 500; color: #18181b;">${escapeHtml(item.title)}</td>
            <td style="padding: 10px 12px; text-align: center; color: #52525b;">${item.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #52525b;">${item.unitPrice.toLocaleString("ko-KR")}원</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #18181b;">${(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #71717a;">상품 정보 없음</td></tr>`;

  const userAccountInfo = order.user?.email
    ? `${order.user.email}${order.user.name ? ` (${order.user.name})` : ""}`
    : "비회원 또는 정보 없음";

  const subject = `[Studio UDN] 신규 주문 결제 완료 (#${order.id})`;

  const textBody = [
    `[Studio UDN] 신규 주문이 접수되었습니다 (결제 완료)`,
    `==================================================`,
    ``,
    `[1. 주문 및 결제 정보]`,
    `- 주문번호: ${order.id}`,
    `- 결제일시: ${formattedDate} (KST)`,
    `- 결제금액: ${formattedAmount}`,
    `- 결제상태: 결제 완료 (PAID)`,
    `- 결제수단: NICEPAY 온라인 결제`,
    order.paymentKey ? `- 거래키(TID): ${order.paymentKey}` : null,
    `- 주문계정: ${userAccountInfo}`,
    ``,
    `[2. 주문 상품 내역]`,
    textItemLines,
    `- 총 결제 금액: ${formattedAmount}`,
    ``,
    `[3. 배송지 정보]`,
    `- 받는 사람: ${order.recipientName}`,
    `- 연락처: ${order.phone}`,
    `- 배송지 주소: ${fullAddress}`,
    ``,
    `==================================================`,
    `관리자 페이지 바로가기: ${adminUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const htmlBody = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    
    <div style="background-color: #18181b; padding: 24px 28px; color: #ffffff;">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: #a1a1aa; text-transform: uppercase; margin-bottom: 4px;">STUDIO UDN</div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">신규 주문이 접수되었습니다</h1>
    </div>

    <div style="padding: 28px;">
      
      <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; background-color: #059669; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-right: 6px;">결제 완료</span>
              <strong style="color: #065f46; font-size: 14px;">정상 결제 승인되었습니다.</strong>
            </td>
            <td style="text-align: right; color: #047857; font-size: 12px; vertical-align: middle;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">1. 주문 및 결제 정보</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #71717a; width: 110px;">주문 번호</td>
          <td style="padding: 6px 0; font-weight: 600; font-family: monospace, monospace; color: #18181b;">${escapeHtml(order.id)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">결제 금액</td>
          <td style="padding: 6px 0; font-weight: 700; color: #18181b; font-size: 16px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">결제 수단</td>
          <td style="padding: 6px 0; color: #27272a;">NICEPAY 온라인 결제</td>
        </tr>
        ${
          order.paymentKey
            ? `
        <tr>
          <td style="padding: 6px 0; color: #71717a;">거래 키 (TID)</td>
          <td style="padding: 6px 0; color: #52525b; font-family: monospace, monospace; font-size: 12px; word-break: break-all;">${escapeHtml(order.paymentKey)}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding: 6px 0; color: #71717a;">주문자 계정</td>
          <td style="padding: 6px 0; color: #27272a;">${escapeHtml(userAccountInfo)}</td>
        </tr>
      </table>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">2. 주문 상품 목록</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; border: 1px solid #e4e4e7;">
        <thead>
          <tr style="background-color: #f4f4f5; text-align: left; color: #52525b;">
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7;">상품명</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: center; width: 50px;">수량</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: right; width: 90px;">단가</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: right; width: 100px;">소계</th>
          </tr>
        </thead>
        <tbody>
          ${htmlItemRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #fafafa;">
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #3f3f46; border-top: 1px solid #e4e4e7;">총 결제 금액</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 15px; color: #18181b; border-top: 1px solid #e4e4e7;">${formattedAmount}</td>
          </tr>
        </tfoot>
      </table>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">3. 배송지 정보</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #71717a; width: 110px;">받는 사람</td>
          <td style="padding: 6px 0; font-weight: 600; color: #18181b;">${escapeHtml(order.recipientName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">연락처</td>
          <td style="padding: 6px 0; color: #27272a;">${escapeHtml(order.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a; vertical-align: top;">배송지 주소</td>
          <td style="padding: 6px 0; color: #27272a; line-height: 1.5;">${escapeHtml(fullAddress)}</td>
        </tr>
      </table>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e4e4e7;">
        <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 6px;">관리자 페이지에서 주문 관리</a>
      </div>

    </div>

    <div style="background-color: #f4f4f5; padding: 16px 28px; font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #e4e4e7;">
      본 메일은 STUDIO UDN 쇼핑몰의 주문 접수 알림 시스템에서 자동으로 발송되었습니다.
    </div>

  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.info("[mailer] payment admin email sent successfully", { orderId: order.id, to });
  } catch (error) {
    console.error("[mailer] payment notification failed", error);
  }
}

export async function sendOrderCancelledAdminEmail(order: OrderEmailData): Promise<void> {
  const to = process.env.ADMIN_EMAIL ?? ADMIN_EMAIL ?? "studioudn@naver.com";
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "studioudn@naver.com";
  const transporter = createTransporter();
  if (!transporter || !to || !from) return;

  const fullAddress = [order.address, order.addressDetail].filter(Boolean).join(" ");
  const siteUrl = getSiteUrl();
  const adminUrl = `${siteUrl}/admin`;
  const formattedDate = formatKST(order.updatedAt || new Date());
  const formattedAmount = `${order.totalAmount.toLocaleString("ko-KR")}원`;
  const isRefunded = order.paymentStatus === "REFUNDED";
  const statusLabel = isRefunded ? "결제 취소 및 환불 완료" : "주문 취소 완료 (미결제)";
  const cancelReason = order.cancelReason?.trim() || "고객 요청 취소";

  const textItemLines = order.items.length
    ? order.items
        .map(
          (item) =>
            `- ${item.title} × ${item.quantity}개 (${(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원 / 단가 ${item.unitPrice.toLocaleString("ko-KR")}원)`
        )
        .join("\n")
    : "- 상품 정보 없음";

  const htmlItemRows = order.items.length
    ? order.items
        .map(
          (item) => `
          <tr style="border-bottom: 1px solid #f4f4f5;">
            <td style="padding: 10px 12px; font-weight: 500; color: #18181b;">${escapeHtml(item.title)}</td>
            <td style="padding: 10px 12px; text-align: center; color: #52525b;">${item.quantity}</td>
            <td style="padding: 10px 12px; text-align: right; color: #52525b;">${item.unitPrice.toLocaleString("ko-KR")}원</td>
            <td style="padding: 10px 12px; text-align: right; font-weight: 600; color: #18181b;">${(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원</td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="4" style="padding: 12px; text-align: center; color: #71717a;">상품 정보 없음</td></tr>`;

  const userAccountInfo = order.user?.email
    ? `${order.user.email}${order.user.name ? ` (${order.user.name})` : ""}`
    : "비회원 또는 정보 없음";

  const subject = `[Studio UDN] 주문 취소/환불 안내 (#${order.id})`;

  const textBody = [
    `[Studio UDN] 주문이 취소되었습니다 (${statusLabel})`,
    `==================================================`,
    ``,
    `[1. 취소 내역 요약]`,
    `- 주문번호: ${order.id}`,
    `- 취소일시: ${formattedDate} (KST)`,
    `- 취소/환불금액: ${formattedAmount}`,
    `- 취소사유: ${cancelReason}`,
    `- 처리상태: ${statusLabel}`,
    order.paymentKey ? `- 원거래키(TID): ${order.paymentKey}` : null,
    `- 주문계정: ${userAccountInfo}`,
    ``,
    `[2. 취소 상품 목록]`,
    textItemLines,
    `- 취소 총액: ${formattedAmount}`,
    ``,
    `[3. 주문 고객 정보]`,
    `- 받는 사람: ${order.recipientName}`,
    `- 연락처: ${order.phone}`,
    `- 배송지 주소: ${fullAddress}`,
    ``,
    `==================================================`,
    `관리자 페이지 바로가기: ${adminUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  const htmlBody = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <div style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
    
    <div style="background-color: #7f1d1d; padding: 24px 28px; color: #ffffff;">
      <div style="font-size: 12px; font-weight: 600; letter-spacing: 0.1em; color: #fecaca; text-transform: uppercase; margin-bottom: 4px;">STUDIO UDN</div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: #ffffff;">주문이 취소되었습니다</h1>
    </div>

    <div style="padding: 28px;">
      
      <div style="margin-bottom: 24px; padding: 14px 18px; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <span style="display: inline-block; background-color: #dc2626; color: #ffffff; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-right: 6px;">${isRefunded ? "환불 완료" : "주문 취소"}</span>
              <strong style="color: #991b1b; font-size: 14px;">${escapeHtml(statusLabel)}</strong>
            </td>
            <td style="text-align: right; color: #b91c1c; font-size: 12px; vertical-align: middle;">${formattedDate}</td>
          </tr>
        </table>
      </div>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">1. 취소 내역 요약</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #71717a; width: 110px;">주문 번호</td>
          <td style="padding: 6px 0; font-weight: 600; font-family: monospace, monospace; color: #18181b;">${escapeHtml(order.id)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">취소/환불 금액</td>
          <td style="padding: 6px 0; font-weight: 700; color: #dc2626; font-size: 16px;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">취소 사유</td>
          <td style="padding: 6px 0; font-weight: 600; color: #27272a;">${escapeHtml(cancelReason)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">처리 상태</td>
          <td style="padding: 6px 0; color: #27272a;">${escapeHtml(statusLabel)}</td>
        </tr>
        ${
          order.paymentKey
            ? `
        <tr>
          <td style="padding: 6px 0; color: #71717a;">원거래 키 (TID)</td>
          <td style="padding: 6px 0; color: #52525b; font-family: monospace, monospace; font-size: 12px; word-break: break-all;">${escapeHtml(order.paymentKey)}</td>
        </tr>`
            : ""
        }
        <tr>
          <td style="padding: 6px 0; color: #71717a;">주문자 계정</td>
          <td style="padding: 6px 0; color: #27272a;">${escapeHtml(userAccountInfo)}</td>
        </tr>
      </table>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">2. 취소 상품 목록</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; border: 1px solid #e4e4e7;">
        <thead>
          <tr style="background-color: #f4f4f5; text-align: left; color: #52525b;">
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7;">상품명</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: center; width: 50px;">수량</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: right; width: 90px;">단가</th>
            <th style="padding: 10px 12px; border-bottom: 1px solid #e4e4e7; text-align: right; width: 100px;">소계</th>
          </tr>
        </thead>
        <tbody>
          ${htmlItemRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #fafafa;">
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: 600; color: #3f3f46; border-top: 1px solid #e4e4e7;">취소/환불 총액</td>
            <td style="padding: 12px; text-align: right; font-weight: 700; font-size: 15px; color: #dc2626; border-top: 1px solid #e4e4e7;">${formattedAmount}</td>
          </tr>
        </tfoot>
      </table>

      <h2 style="font-size: 15px; font-weight: 700; margin: 0 0 12px; color: #18181b; border-bottom: 1px solid #e4e4e7; padding-bottom: 6px;">3. 주문 고객 정보</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
        <tr>
          <td style="padding: 6px 0; color: #71717a; width: 110px;">받는 사람</td>
          <td style="padding: 6px 0; font-weight: 600; color: #18181b;">${escapeHtml(order.recipientName)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a;">연락처</td>
          <td style="padding: 6px 0; color: #27272a;">${escapeHtml(order.phone)}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #71717a; vertical-align: top;">배송지 주소</td>
          <td style="padding: 6px 0; color: #27272a; line-height: 1.5;">${escapeHtml(fullAddress)}</td>
        </tr>
      </table>

      <div style="text-align: center; padding-top: 16px; border-top: 1px solid #e4e4e7;">
        <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 6px;">관리자 페이지에서 주문 관리</a>
      </div>

    </div>

    <div style="background-color: #f4f4f5; padding: 16px 28px; font-size: 12px; color: #71717a; text-align: center; border-top: 1px solid #e4e4e7;">
      본 메일은 STUDIO UDN 쇼핑몰의 주문 취소 알림 시스템에서 자동으로 발송되었습니다.
    </div>

  </div>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.info("[mailer] cancel admin email sent successfully", { orderId: order.id, to });
  } catch (error) {
    console.error("[mailer] cancel notification failed", error);
  }
}
