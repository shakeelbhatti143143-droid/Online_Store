import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IProductImage extends Document {
  productId: Types.ObjectId;
  url: string;
  altText: string;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    url: { type: String, required: true },
    altText: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'product_images' }
);

ProductImageSchema.index({ productId: 1, displayOrder: 1 });

const ProductImage: Model<IProductImage> =
  (mongoose.models.ProductImage as Model<IProductImage>) ||
  mongoose.model<IProductImage>('ProductImage', ProductImageSchema);

export default ProductImage;
