import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProductVariant extends Document {
  productId: Types.ObjectId;
  name: string;
  sku?: string;
  colorName?: string;
  colorHex?: string;
  size?: string;
  priceModifier: number;
  stockQuantity: number;
  imageUrl?: string;
  createdAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, trim: true, uppercase: true },
    colorName: { type: String, default: '' },
    colorHex: { type: String, default: '' },
    size: { type: String, default: '' },
    priceModifier: { type: Number, default: 0 },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'product_variants' }
);

ProductVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductVariantSchema.index({ productId: 1 });

const ProductVariant: Model<IProductVariant> =
  (mongoose.models.ProductVariant as Model<IProductVariant>) ||
  mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);

export default ProductVariant;
