import mongoose, { Schema, Document, Model } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IMessage extends Document {
    tenantId: mongoose.Types.ObjectId;
    conversationId: mongoose.Types.ObjectId;
    role: MessageRole;
    content: string;
    tokenUsage: number;
    latencyMs: number;
    sources: Array<{ documentId: string; fileName: string; chunkIndex: number; score: number }>;
    metadata: Record<string, unknown>;
    createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true, index: true },
        content: { type: String, required: true },
        tokenUsage: { type: Number, default: 0 },
        latencyMs: { type: Number, default: 0 },
        sources: {
            type: [
                {
                    documentId: { type: String, default: '' },
                    fileName: { type: String, default: '' },
                    chunkIndex: { type: Number, default: 0 },
                    score: { type: Number, default: 0 },
                },
            ],
            default: [],
        },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: { createdAt: true, updatedAt: false }, collection: 'messages' }
);

MessageSchema.index({ tenantId: 1, conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, createdAt: 1 });

const Message: Model<IMessage> =
    (mongoose.models.Message as Model<IMessage>) ||
    mongoose.model<IMessage>('Message', MessageSchema);

export default Message;