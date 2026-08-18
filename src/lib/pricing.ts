import { Coupon } from '@/types';

export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_FEE = 25;
export const TAX_RATE = 0.075;

export const DELIVERY_COSTS: Record<string, number> = {
  standard: 0,
  express: 15,
  priority: 25,
};

export function calcDiscountPercentage(price: number, originalPrice?: number): number {
  if (originalPrice && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return 0;
}

export function calcCouponDiscount(coupon: Coupon, subtotal: number): number {
  if (!coupon) return 0;
  if (coupon.discountType === 'percentage') {
    const calc = (subtotal * coupon.discountValue) / 100;
    return coupon.maxDiscountAmount ? Math.min(calc, coupon.maxDiscountAmount) : calc;
  }
  return Math.min(subtotal, coupon.discountValue);
}

export function calcShippingAmount(subtotal: number, couponCode?: string, deliveryMethod = 'standard'): number {
  if (couponCode === 'FREESHIP') return 0;
  const methodFee = DELIVERY_COSTS[deliveryMethod] ?? 0;
  const base = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE;
  if (deliveryMethod === 'standard') return base;
  return methodFee;
}

export function calcTaxAmount(subtotal: number, discountAmount: number): number {
  const taxable = Math.max(0, subtotal - discountAmount);
  return Math.round(taxable * TAX_RATE * 100) / 100;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
