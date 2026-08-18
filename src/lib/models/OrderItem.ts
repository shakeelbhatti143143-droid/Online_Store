import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: Types.ObjectId;
  productId?: Types.ObjectId;
  productTitle: string;
  productImage: string;
  variantName?: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productTitle: { type: String, required: true },
    productImage: { type: String, default: '' },
    variantName: { type: String, default: '' },
    sku: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'order_items' }
);


const OrderItem: Model<IOrderItem> =
  (mongoose.models.OrderItem as Model<IOrderItem>) ||
  mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);

export default OrderItem;
