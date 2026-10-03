import "server-only";
import nodemailer from "nodemailer";

type PaidOrder = {
  id: string;
  totalAmount: number;
  recipientName: string;
  phone: string;
  address: string;
  addressDetail: string | null;
  items: Array<{ title: string; quantity: number; unitPrice: number }>;
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

export async function sendPaymentAdminEmail(order: PaidOrder): Promise<void> {
  const to = process.env.ADMIN_EMAIL ?? process.env.SMTP_USER;
  const from = process.env.MAIL_FROM ?? process.env.SMTP_USER;
  const transporter = createTransporter();
  if (!transporter || !to || !from) return;

  const itemLines = order.items
    .map((item) => `- ${item.title} × ${item.quantity} (${(item.unitPrice * item.quantity).toLocaleString("ko-KR")}원)`)
    .join("\n");

  try {
    await transporter.sendMail({
      from,
      to,
      subject: `[Studio UDN] 결제 완료 - ${order.id}`,
      text: [
        "새 결제가 완료되었습니다.",
        `주문번호: ${order.id}`,
        `결제금액: ${order.totalAmount.toLocaleString("ko-KR")}원`,
        "",
        "상품:",
        itemLines || "- 상품 정보 없음",
        "",
        `수령인: ${order.recipientName}`,
        `연락처: ${order.phone}`,
        `주소: ${order.address}${order.addressDetail ? ` ${order.addressDetail}` : ""}`,
      ].join("\n"),
    });
  } catch (error) {
    // 결제 성공 여부와 메일 서버 상태를 분리합니다. 실패 시 서버 로그에서 확인합니다.
    console.error("[mailer] payment notification failed", error);
  }
}
