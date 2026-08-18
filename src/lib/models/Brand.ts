import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  createdAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    website: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'brands' }
);

BrandSchema.index({ slug: 1 }, { unique: true });
BrandSchema.index({ name: 1 }, { unique: true });

const Brand: Model<IBrand> =
  (mongoose.models.Brand as Model<IBrand>) || mongoose.model<IBrand>('Brand', BrandSchema);

export default Brand;
