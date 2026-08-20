
import mongoose, { Schema, Document, Model } from 'mongoose';

export type ChatbotStatus = 'active' | 'inactive';

export type AIProvider =
    | 'openai'
    | 'anthropic'
    | 'gemini'
    | 'custom';

export interface ICAIConfig {
    provider: AIProvider;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    welcomeMessage: string;
    fallbackMessage: string;
    apiKeyRef: string; // references tenant credential store, NEVER the raw key
}

export interface IAppearanceConfig {
    title: string;
    subtitle: string;
    logoUrl: string;
    avatarUrl: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    userMessageColor: string;
    botMessageColor: string;
    borderRadius: number;
    fontSize: number;
    position: 'bottom-right' | 'bottom-left';
    buttonIcon: string;
    buttonSize: number;
    welcomeMessage: string;
    placeholderText: string;
    showBranding: boolean;
    customCss: string;
}

export interface IChatbot extends Document {
    tenantId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    publicId: string;
    name: string;
    description: string;
    internalIdentifier: string;
    status: ChatbotStatus;
    aiConfig: ICAIConfig;
    appearance: IAppearanceConfig;
    isDeleted: boolean;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AIConfigSchema = new Schema<ICAIConfig>(
    {
        provider: {
            type: String,
            enum: ['openai', 'anthropic', 'gemini', 'custom'],
            default: 'gemini',
        },

        // Gemini 3.1 Flash-Lite
        model: {
            type: String,
            default: 'gemini-3.1-flash-lite',
        },

        temperature: {
            type: Number,
            default: 0.3,
            min: 0,
            max: 2,
        },

        maxTokens: {
            type: Number,
            default: 500,
            min: 100,
            max: 8000,
        },

        systemPrompt: {
            type: String,
            default: `You are a helpful customer support assistant for {{company_name}}.

Answer questions using the company's knowledge base.

If you do not know the answer, clearly say that you do not have enough information.

Do not invent information.

Be professional, concise, and friendly.`,
        },

        welcomeMessage: {
            type: String,
            default: 'Hello! How can I help you today?',
        },

        fallbackMessage: {
            type: String,
            default:
                'I do not have enough information to answer that. Please contact our support team.',
        },

        apiKeyRef: {
            type: String,
            default: '',
        },
    },
    { _id: false }
);

const AppearanceSchema = new Schema<IAppearanceConfig>(
    {
        title: {
            type: String,
            default: 'Customer Support',
        },

        subtitle: {
            type: String,
            default: 'We typically reply in a few minutes',
        },

        logoUrl: {
            type: String,
            default: '',
        },

        avatarUrl: {
            type: String,
            default: '',
        },

        primaryColor: {
            type: String,
            default: '#2563EB',
        },

        secondaryColor: {
            type: String,
            default: '#1E40AF',
        },

        textColor: {
            type: String,
            default: '#1F2937',
        },

        backgroundColor: {
            type: String,
            default: '#FFFFFF',
        },

        userMessageColor: {
            type: String,
            default: '#2563EB',
        },

        botMessageColor: {
            type: String,
            default: '#F3F4F6',
        },

        borderRadius: {
            type: Number,
            default: 12,
            min: 0,
            max: 32,
        },

        fontSize: {
            type: Number,
            default: 14,
            min: 11,
            max: 20,
        },

        position: {
            type: String,
            enum: ['bottom-right', 'bottom-left'],
            default: 'bottom-right',
        },

        buttonIcon: {
            type: String,
            default: 'chat',
        },

        buttonSize: {
            type: Number,
            default: 58,
            min: 40,
            max: 80,
        },

        welcomeMessage: {
            type: String,
            default: 'Hello! How can I help you today?',
        },

        placeholderText: {
            type: String,
            default: 'Type your message...',
        },

        showBranding: {
            type: Boolean,
            default: true,
        },

        customCss: {
            type: String,
            default: '',
        },
    },
    { _id: false }
);

const ChatbotSchema = new Schema<IChatbot>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'Tenant',
            required: true,
            index: true,
        },

        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        publicId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },

        description: {
            type: String,
            default: '',
            maxlength: 2000,
        },

        internalIdentifier: {
            type: String,
            trim: true,
            maxlength: 80,
        },

        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active',
            index: true,
        },

        aiConfig: {
            type: AIConfigSchema,
            default: () => ({}),
        },

        appearance: {
            type: AppearanceSchema,
            default: () => ({}),
        },

        isDeleted: {
            type: Boolean,
            default: false,
            index: true,
        },

        lastActiveAt: {
            type: Date,
            default: null,
        },
    },

    {
        timestamps: true,
        collection: 'chatbot',
    }
);

// Tenant-level isolation
ChatbotSchema.index(
    { tenantId: 1, publicId: 1 },
    { unique: true }
);

ChatbotSchema.index({
    tenantId: 1,
    isDeleted: 1,
    createdAt: -1,
});

const Chatbot: Model<IChatbot> =
    (mongoose.models.Chatbot as Model<IChatbot>) ||
    mongoose.model<IChatbot>('Chatbot', ChatbotSchema);

export default Chatbot;


