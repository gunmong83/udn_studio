export const SHIPPING_FEE = 4_000;
export const FREE_SHIPPING_THRESHOLD = 500_000;

export const SHIPPING_GROUP_LABELS: Record<string, string> = {
  "calendar-2026": "2026년 달력 (별도 배송)",
  "calendar-2027-tape": "2027년 달력·마스킹 테이프 (묶음 배송)",
};

export function getShippingGroupKey(product: { shippingGroup?: string; slug: string }): string {
  return product.shippingGroup ?? product.slug;
}

export function getShippingGroupLabel(group: string): string {
  return SHIPPING_GROUP_LABELS[group] ?? "상품 배송";
}

export function getShippingFee(subtotal: number, shipmentCount = 1): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE * Math.max(0, shipmentCount);
}
