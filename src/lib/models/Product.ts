import mongoose, { Schema, Types } from 'mongoose';

export interface IProduct {
  title: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: Types.ObjectId;
  brandId?: Types.ObjectId;
  stockQuantity: number;
  lowStockThreshold: number;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNew: boolean;
  isActive: boolean;
  badge?: string;
  tags: string[];
  specifications: Map<string, string> | Record<string, string>;
  features: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    shortDescription: {
      type: String,
      default: '',
    },

    description: {
      type: String,
      default: '',
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    originalPrice: {
      type: Number,
      min: 0,
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },

    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    },

    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 3,
      min: 0,
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isBestSeller: {
      type: Boolean,
      default: false,
    },

    isNew: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    badge: {
      type: String,
      default: '',
    },

    tags: {
      type: [String],
      default: [],
    },

    specifications: {
      type: Schema.Types.Mixed,
      default: {},
    },

    features: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'products',
  }
);

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ sku: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ brandId: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ isBestSeller: 1 });
ProductSchema.index({ isNew: 1 });
ProductSchema.index({ isActive: 1 });

// Reuse existing model during Next.js hot reload
const Product =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>('Product', ProductSchema);

export default Product;