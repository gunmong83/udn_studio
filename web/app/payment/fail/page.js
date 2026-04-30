export default async function PaymentFailPage({ searchParams }) {
  const params = await searchParams;
  const message = params?.message || '결제가 완료되지 않았습니다.';

  return <main className="payment-result">{message}</main>;
}
