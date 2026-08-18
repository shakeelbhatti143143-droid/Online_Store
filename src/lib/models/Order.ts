import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { OrderStatus, PaymentStatus, PaymentMethod, DeliveryMethod, Address } from '@/types';

const AddressSnapshotSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

export interface IOrder extends Document {
  orderNumber: string;
  userId?: Types.ObjectId;
  guestEmail?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  deliveryMethod: DeliveryMethod;
  currency: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  couponId?: Types.ObjectId;
  couponCode?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  trackingNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    guestEmail: { type: String, lowercase: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'apple_pay', 'google_pay', 'paypal', 'cod'],
      default: 'card',
    },
    deliveryMethod: {
      type: String,
      enum: ['standard', 'express', 'priority'],
      default: 'standard',
    },
    currency: { type: String, default: 'USD' },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingAmount: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    couponId: { type: Schema.Types.ObjectId, ref: 'Coupon' },
    couponCode: { type: String, uppercase: true },
    shippingAddress: { type: AddressSnapshotSchema, required: true },
    billingAddress: { type: AddressSnapshotSchema },
    trackingNumber: { type: String, default: '' },
    estimatedDelivery: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true, collection: 'orders' }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ orderNumber: 1 }, { unique: true });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
