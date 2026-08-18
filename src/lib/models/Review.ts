import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IReview extends Document {
  productId: Types.ObjectId;
  userId?: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, required: true, trim: true },
    userAvatar: { type: String, default: '' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true, trim: true },
    isVerifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'reviews' }
);

ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ productId: 1, userId: 1 });

const Review: Model<IReview> =
  (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>('Review', ReviewSchema);

export default Review;
