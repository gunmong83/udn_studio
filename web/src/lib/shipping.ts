export const SHIPPING_FEE = 4_000;
export const FREE_SHIPPING_THRESHOLD = 500_000;

export function getShippingFee(subtotal: number): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
