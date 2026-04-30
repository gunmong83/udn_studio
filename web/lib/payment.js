const TOSS_CONFIRM_URL = 'https://api.tosspayments.com/v1/payments/confirm';

export function createOrderId() {
  return `udn_${Date.now()}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:8080';
}

export async function confirmTossPayment({ paymentKey, orderId, amount }) {
  if (!process.env.TOSS_SECRET_KEY) {
    return {
      paymentKey,
      orderId,
      totalAmount: amount,
      method: 'TOSS_TEST_NOT_CONFIGURED',
      approvedAt: new Date().toISOString(),
    };
  }

  const encryptedSecret = Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64');
  const response = await fetch(TOSS_CONFIRM_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encryptedSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'Payment confirmation failed');
  }

  return payload;
}
