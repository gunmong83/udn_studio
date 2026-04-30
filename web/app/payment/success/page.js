'use client';

import { useEffect, useState } from 'react';

export default function PaymentSuccessPage() {
  const [message, setMessage] = useState('결제를 확인하는 중입니다.');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setMessage('결제 승인에 필요한 정보가 부족합니다.');
      return;
    }

    fetch('/api/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || '결제 승인에 실패했습니다.');
        }
        setMessage('결제가 완료되었습니다.');
      })
      .catch((error) => setMessage(error.message));
  }, []);

  return <main className="payment-result">{message}</main>;
}
