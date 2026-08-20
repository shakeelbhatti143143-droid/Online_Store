import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAllowedDomain extends Document {
    tenantId: mongoose.Types.ObjectId;
    chatbotId: mongoose.Types.ObjectId;
    domain: string; // e.g. "example.com" or "*.example.com"
    isEnabled: boolean;
    verificationToken: string;
    verifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const AllowedDomainSchema = new Schema<IAllowedDomain>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        chatbotId: { type: Schema.Types.ObjectId, ref: 'Chatbot', required: true, index: true },
        domain: { type: String, required: true, trim: true, lowercase: true, maxlength: 255 },
        isEnabled: { type: Boolean, default: true },
        verificationToken: { type: String, default: '' },
        verifiedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: 'chatbot_domains' }
);

// A domain can be added to a chatbot only once
AllowedDomainSchema.index({ chatbotId: 1, domain: 1 }, { unique: true });
AllowedDomainSchema.index({ tenantId: 1, chatbotId: 1 });

const AllowedDomain: Model<IAllowedDomain> =
    (mongoose.models.AllowedDomain as Model<IAllowedDomain>) ||
    mongoose.model<IAllowedDomain>('AllowedDomain', AllowedDomainSchema);

export default AllowedDomain;