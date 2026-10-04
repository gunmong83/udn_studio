import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getAuthenticatedUserId } from "@/src/lib/session-user";

export const runtime = "nodejs";

class NaverDisconnectError extends Error {}

/**
 * Deleting our local Account row does not revoke Naver's separate consent
 * grant. Revoke it first so a future signup is treated as a fresh connection
 * and Naver can show its own consent screen again.
 */
async function revokeNaverConnection(token: string, tokenTypeHint: "access_token" | "refresh_token") {
  const clientId = process.env.AUTH_NAVER_ID;
  const clientSecret = process.env.AUTH_NAVER_SECRET;
  if (!clientId || !clientSecret) {
    throw new NaverDisconnectError("Naver OAuth configuration is unavailable.");
  }

  const response = await fetch("https://nid.naver.com/oauth2.0/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: tokenTypeHint,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    // Never log the token or Naver response body: both can contain sensitive
    // connection details.
    console.error("[account] Naver connection revocation failed", { status: response.status });
    throw new NaverDisconnectError("Naver did not accept the connection revocation.");
  }
}

/**
 * Permanently closes the authenticated account.
 *
 * Order/payment ledgers are retained for statutory accounting and dispute
 * handling, but their customer ownership and shipping PII are anonymized.
 */
export async function DELETE(request: Request) {
  const userId = await getAuthenticatedUserId();
  if (!userId) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const body = await request.json().catch(() => null) as { confirmation?: string; acknowledged?: boolean } | null;
  if (body?.confirmation !== "탈퇴" || body.acknowledged !== true) {
    return NextResponse.json({ error: "탈퇴 확인 문구와 안내 확인이 필요합니다." }, { status: 400 });
  }

  try {
    const activeOrders = await prisma.order.count({
      where: {
        userId,
        status: { in: ["PAID", "PREPARING", "SHIPPED"] },
      },
    });
    if (activeOrders > 0) {
      return NextResponse.json(
        { error: "배송 또는 결제 처리 중인 주문이 있어 탈퇴할 수 없습니다. 주문 처리가 끝난 뒤 다시 시도해주세요." },
        { status: 409 },
      );
    }

    const linkedAccounts = await prisma.account.findMany({
      where: { userId, provider: "naver" },
      select: { access_token: true, refresh_token: true },
    });

    // Do this before changing local data. If Naver is temporarily unavailable,
    // keep the account intact so the member can retry and receive a reliable
    // fresh-consent flow on the next signup.
    for (const account of linkedAccounts) {
      const token = account.refresh_token ?? account.access_token;
      if (!token) {
        throw new NaverDisconnectError("No Naver connection token is available.");
      }
      await revokeNaverConnection(token, account.refresh_token ? "refresh_token" : "access_token");
    }

    await prisma.$transaction(async (tx) => {
      // Keep the order/payment ledger, but remove customer-identifying data.
      await tx.order.updateMany({
        where: { userId },
        data: {
          userId: null,
          recipientName: "탈퇴회원",
          phone: "삭제됨",
          address: "삭제됨",
          addressDetail: null,
          carrier: null,
          trackingNumber: null,
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[account] account deletion failed", { userId, errorCode: error instanceof Error ? error.name : "unknown" });
    if (error instanceof NaverDisconnectError) {
      return NextResponse.json(
        { error: "네이버 연결 해제에 실패했습니다. 잠시 후 다시 시도해주세요." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "계정 탈퇴 처리에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
