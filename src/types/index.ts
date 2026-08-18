export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
  emailVerified: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  icon?: string;
  isFeatured?: boolean;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku?: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  priceModifier: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export type ProductBadge = 'NEW' | 'BEST SELLER' | 'SALE' | 'LIMITED' | 'OUT OF STOCK';

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  categoryId: string;
  categoryName?: string;
  brandId?: string;
  brandName?: string;
  images: string[];
  stockQuantity: number;
  lowStockThreshold: number;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  badge?: ProductBadge;
  tags: string[];
  features: string[];
  specifications: Record<string, string>;
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  selectedColor?: string;
  selectedSize?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  appliedCoupon?: Coupon;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
}

export interface Address {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'cod';
export type DeliveryMethod = 'standard' | 'express' | 'priority';

export interface OrderItem {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  variantName?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponCode?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreNotification {
  id: string;
  type: 'order_placed' | 'low_stock' | 'payment_success' | 'order_shipped' | 'review_added' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  lowStockCount: number;
  revenueChangePct: number;
  ordersChangePct: number;
  customersChangePct: number;
  salesData: {
    date: string;
    revenue: number;
    orders: number;
  }[];
  categoryDistribution: {
    category: string;
    revenue: number;
    percentage: number;
  }[];
  topSellingProducts: {
    id: string;
    title: string;
    imageUrl: string;
    price: number;
    salesCount: number;
    totalRevenue: number;
  }[];
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  actionRequired?: {
    actionType: 'DELETE_PRODUCT' | 'CANCEL_ORDER' | 'UPDATE_PRICE' | 'CREATE_PRODUCT';
    title: string;
    description: string;
    payload: any;
  };
  actionConfirmed?: boolean;
}
