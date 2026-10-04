import { NextResponse } from "next/server";

/** @deprecated NICEPAY 승인 결과는 /api/payments/nicepay/return에서 서버 승인합니다. */
export async function POST() {
  return NextResponse.json({ error: "사용하지 않는 결제 승인 경로입니다." }, { status: 410 });
}
