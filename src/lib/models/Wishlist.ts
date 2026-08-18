import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'wishlists' }
);

WishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });
WishlistSchema.index({ userId: 1 });

const Wishlist: Model<IWishlist> =
  (mongoose.models.Wishlist as Model<IWishlist>) ||
  mongoose.model<IWishlist>('Wishlist', WishlistSchema);

export default Wishlist;
