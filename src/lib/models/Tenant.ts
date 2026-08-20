import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
    name: string;
    slug: string;
    ownerId: mongoose.Types.ObjectId;
    plan: 'free' | 'pro' | 'enterprise';
    brandingEnabled: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
    {
        name: { type: String, required: true, trim: true, maxlength: 120 },
        slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        brandingEnabled: { type: Boolean, default: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true, collection: 'tenants' }
);

TenantSchema.index({ slug: 1 }, { unique: true });
TenantSchema.index({ ownerId: 1 });

const Tenant: Model<ITenant> =
    (mongoose.models.Tenant as Model<ITenant>) ||
    mongoose.model<ITenant>('Tenant', TenantSchema);

export default Tenant;