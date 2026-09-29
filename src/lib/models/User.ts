import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole } from '@/types';

export interface IUser extends Document {
  email: string;
  fullName: string;
  password: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  title?: string;
  dateOfBirth?: string;
  preferredCurrency?: string;
  newsletterSubscribed?: boolean;
  orderNotifications?: boolean;
  vipOffers?: boolean;
  securityAlerts?: boolean;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // --- Email verification fields ---
  emailVerified: boolean;
  emailVerificationTokenHash?: string | null;
  emailVerificationExpires?: Date | null;
  emailVerifiedAt?: Date | null;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name cannot exceed 80 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatarUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
    title: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    preferredCurrency: { type: String, default: 'USD' },
    newsletterSubscribed: { type: Boolean, default: true },
    orderNotifications: { type: Boolean, default: true },
    vipOffers: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: { type: Boolean, default: true },

    // --- Email verification fields ---
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null },
    emailVerificationExpires: { type: Date, default: null },
    emailVerifiedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'users' }
);

UserSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema);

export default User;
