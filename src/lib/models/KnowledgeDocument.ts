import mongoose, { Schema, Document, Model } from 'mongoose';

export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type DocumentSourceType = 'file' | 'url' | 'text';

export interface IKnowledgeChunk {
    index: number;
    content: string;
    embedding: number[];
    tokenCount: number;
}

export interface IKnowledgeDocument extends Document {
    tenantId: mongoose.Types.ObjectId;
    chatbotId: mongoose.Types.ObjectId;
    sourceType: DocumentSourceType;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl: string;
    sourceUrl: string;
    content: string;
    chunks: IKnowledgeChunk[];
    status: DocumentStatus;
    errorMessage: string;
    chunkCount: number;
    vectorCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const KnowledgeChunkSchema = new Schema<IKnowledgeChunk>(
    {
        index: { type: Number, required: true },
        content: { type: String, required: true },
        embedding: { type: [Number], default: [] },
        tokenCount: { type: Number, default: 0 },
    },
    { _id: false }
);

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
    {
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
        chatbotId: { type: Schema.Types.ObjectId, ref: 'Chatbot', required: true, index: true },
        sourceType: { type: String, enum: ['file', 'url', 'text'], required: true },
        fileName: { type: String, default: '' },
        fileType: { type: String, default: '' },
        fileSize: { type: Number, default: 0 },
        fileUrl: { type: String, default: '' },
        sourceUrl: { type: String, default: '' },
        content: { type: String, default: '' },
        chunks: { type: [KnowledgeChunkSchema], default: [] },
        status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending', index: true },
        errorMessage: { type: String, default: '' },
        chunkCount: { type: Number, default: 0 },
        vectorCount: { type: Number, default: 0 },
        isDeleted: { type: Boolean, default: false, index: true },
    },
    { timestamps: true, collection: 'knowledge' }
);

KnowledgeDocumentSchema.index({ tenantId: 1, chatbotId: 1, isDeleted: 1, createdAt: -1 });
// Index for RAG retrieval queries
KnowledgeDocumentSchema.index({ chatbotId: 1, status: 1 });

const KnowledgeDocument: Model<IKnowledgeDocument> =
    (mongoose.models.KnowledgeDocument as Model<IKnowledgeDocument>) ||
    mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);

export default KnowledgeDocument;
