import mongoose from 'mongoose';
import { Product, ProductVariant, ProductReview, Category, Brand, Coupon, Order, OrderItem, UserProfile, StoreNotification, AnalyticsSummary } from '@/types';
import { calcDiscountPercentage } from '@/lib/pricing';

export function toId(value: unknown): string {
  return String(value);
}

export function toIso(value?: Date | string | null): string {
  if (!value) return new Date().toISOString();
  return value instanceof Date ? value.toISOString() : value;
}

export function mapCategory(doc: any, productCount = 0): Category {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description || '',
    imageUrl: doc.imageUrl || '',
    icon: doc.icon,
    isFeatured: Boolean(doc.isFeatured),
    productCount,
  };
}

export function mapBrand(doc: any): Brand {
  return {
    id: toId(doc._id),
    name: doc.name,
    slug: doc.slug,
    logoUrl: doc.logoUrl,
    description: doc.description,
  };
}

export function mapVariant(doc: any): ProductVariant {
  return {
    id: toId(doc._id),
    name: doc.name,
    sku: doc.sku,
    colorName: doc.colorName,
    colorHex: doc.colorHex,
    size: doc.size,
    priceModifier: Number(doc.priceModifier) || 0,
    stockQuantity: Number(doc.stockQuantity) || 0,
    imageUrl: doc.imageUrl,
  };
}

export function mapReview(doc: any): ProductReview {
  return {
    id: toId(doc._id),
    productId: toId(doc.productId),
    userId: doc.userId ? toId(doc.userId) : undefined,
    userName: doc.userName,
    userAvatar: doc.userAvatar,
    rating: Number(doc.rating),
    title: doc.title || '',
    comment: doc.comment || '',
    isVerifiedPurchase: Boolean(doc.isVerifiedPurchase),
    createdAt: toIso(doc.createdAt),
  };
}

export function mapCoupon(doc: any): Coupon {
  return {
    id: toId(doc._id),
    code: doc.code,
    description: doc.description || '',
    discountType: doc.discountType,
    discountValue: Number(doc.discountValue),
    minOrderAmount: Number(doc.minOrderAmount) || 0,
    maxDiscountAmount: doc.maxDiscountAmount != null ? Number(doc.maxDiscountAmount) : undefined,
    usageLimit: doc.usageLimit != null ? Number(doc.usageLimit) : undefined,
    usedCount: Number(doc.usedCount) || 0,
    isActive: Boolean(doc.isActive),
    expiresAt: doc.expiresAt ? toIso(doc.expiresAt) : undefined,
  };
}

export function mapUser(doc: any): UserProfile {
  return {
    id: toId(doc._id),
    email: doc.email,
    fullName: doc.fullName,
    avatarUrl: doc.avatarUrl,
    phone: doc.phone,
    role: doc.role,
    createdAt: toIso(doc.createdAt),
    emailVerified: Boolean(doc.emailVerified),
  };
}

export function mapNotification(doc: any): StoreNotification {
  return {
    id: toId(doc._id),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    isRead: Boolean(doc.isRead),
    createdAt: toIso(doc.createdAt),
    link: doc.link,
  };
}

export function mapOrderItem(doc: any): OrderItem {
  return {
    id: toId(doc._id),
    productId: doc.productId ? toId(doc.productId) : '',
    productTitle: doc.productTitle,
    productImage: doc.productImage || '',
    variantName: doc.variantName,
    sku: doc.sku,
    unitPrice: Number(doc.unitPrice),
    quantity: Number(doc.quantity),
    totalPrice: Number(doc.totalPrice),
  };
}

export function mapOrder(doc: any, items: OrderItem[] = []): Order {
  return {
    id: toId(doc._id),
    orderNumber: doc.orderNumber,
    userId: doc.userId ? toId(doc.userId) : undefined,
    customerEmail: doc.customerEmail,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    status: doc.status,
    paymentStatus: doc.paymentStatus,
    paymentMethod: doc.paymentMethod,
    deliveryMethod: doc.deliveryMethod,
    subtotal: Number(doc.subtotal),
    discountAmount: Number(doc.discountAmount) || 0,
    shippingAmount: Number(doc.shippingAmount) || 0,
    taxAmount: Number(doc.taxAmount) || 0,
    totalAmount: Number(doc.totalAmount),
    couponCode: doc.couponCode,
    shippingAddress: doc.shippingAddress,
    billingAddress: doc.billingAddress,
    items,
    trackingNumber: doc.trackingNumber,
    estimatedDelivery: doc.estimatedDelivery,
    notes: doc.notes,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function mapProduct(params: {
  product: any;
  images?: string[];
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  categoryName?: string;
  brandName?: string;
}): Product {
  const { product, images = [], variants = [], reviews, categoryName, brandName } = params;
  const price = Number(product.price) || 0;
  const originalPrice = product.originalPrice != null ? Number(product.originalPrice) : undefined;
  const specs =
    product.specifications instanceof Map
      ? Object.fromEntries(product.specifications)
      : product.specifications || {};

  return {
    id: toId(product._id),
    title: product.title,
    slug: product.slug,
    sku: product.sku,
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    price,
    originalPrice,
    discountPercentage: calcDiscountPercentage(price, originalPrice),
    categoryId: toId(product.categoryId),
    categoryName,
    brandId: product.brandId ? toId(product.brandId) : undefined,
    brandName,
    images,
    stockQuantity: Number(product.stockQuantity) || 0,
    lowStockThreshold: Number(product.lowStockThreshold) || 0,
    rating: Number(product.rating) || 0,
    reviewsCount: Number(product.reviewsCount) || 0,
    isFeatured: Boolean(product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    isNewArrival: Boolean(product.isNewArrival),
    badge: product.badge || undefined,
    tags: product.tags || [],
    features: product.features || [],
    specifications: specs,
    variants,
    reviews,
    createdAt: toIso(product.createdAt),
    updatedAt: toIso(product.updatedAt),
  };
}

export function isObjectId(value: string): boolean {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;
}
