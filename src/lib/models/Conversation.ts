import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IConversation extends Document {
    tenantId: mongoose.Types.ObjectId;
    chatbotId: mongoose.Types.ObjectId;
    visitorId: string;
    sessionId: string;
    startedAt: Date;
    lastMessageAt: Date;
    messageCount: number;
    tokenUsage: number;
    aiCostEstimate: number;
    aiResponseTimeMs: number;
    isResolved: boolean;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        chatbotId: { type: Schema.Types.ObjectId, ref: 'Chatbot', required: true, index: true },
        visitorId: { type: String, required: true, maxlength: 128 },
        sessionId: { type: String, required: true, maxlength: 128, index: true },
        startedAt: { type: Date, default: Date.now },
        lastMessageAt: { type: Date, default: Date.now, index: true },
        messageCount: { type: Number, default: 0 },
        tokenUsage: { type: Number, default: 0 },
        aiCostEstimate: { type: Number, default: 0 },
        aiResponseTimeMs: { type: Number, default: 0 },
        isResolved: { type: Boolean, default: false },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, collection: 'conversation' }
);

// Enforce tenant isolation in all queries. Queries must always include tenantId.
ConversationSchema.index({ tenantId: 1, chatbotId: 1, lastMessageAt: -1 });
ConversationSchema.index({ chatbotId: 1, visitorId: 1, startedAt: -1 });

const Conversation: Model<IConversation> =
    (mongoose.models.Conversation as Model<IConversation>) ||
    mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
