import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface INotification extends Document {
  userId?: Types.ObjectId | null;
  type: 'order_placed' | 'low_stock' | 'payment_success' | 'order_shipped' | 'review_added' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    type: {
      type: String,
      enum: ['order_placed', 'low_stock', 'payment_success', 'order_shipped', 'review_added', 'system'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'notifications' }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
