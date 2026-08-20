import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Chatbot, { IChatbot } from '@/lib/models/Chatbot';
import AllowedDomain from '@/lib/models/AllowedDomain';
import KnowledgeDocument from '@/lib/models/KnowledgeDocument';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import AdminLog from '@/lib/models/AdminLog';
import { normalizeAllowedDomain } from '@/lib/security/domain-validation';

/**
 * Generate a unique public chatbot ID.
 * Format: cb_<8 random alphanumeric chars>
 */
export function generatePublicChatbotId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `cb_${result}`;
}

export interface CreateChatbotInput {
    tenantId: string;
    createdBy: string;
    name: string;
    description?: string;
    internalIdentifier?: string;
    status?: 'active' | 'inactive';
    aiConfig?: Partial<IChatbot['aiConfig']>;
    appearance?: Partial<IChatbot['appearance']>;
}

export interface UpdateChatbotInput {
    name?: string;
    description?: string;
    internalIdentifier?: string;
    status?: 'active' | 'inactive';
    aiConfig?: Partial<IChatbot['aiConfig']>;
    appearance?: Partial<IChatbot['appearance']>;
}

/**
 * Create a new chatbot scoped to a tenant.
 */
export async function createChatbot(input: CreateChatbotInput): Promise<IChatbot> {
    await connectDB();

    // Generate a unique public ID
    let publicId = generatePublicChatbotId();
    let exists = await Chatbot.findOne({ publicId });
    while (exists) {
        publicId = generatePublicChatbotId();
        exists = await Chatbot.findOne({ publicId });
    }

    const chatbot = await Chatbot.create({
        tenantId: input.tenantId,
        createdBy: input.createdBy,
        publicId,
        name: input.name,
        description: input.description || '',
        internalIdentifier: input.internalIdentifier || '',
        status: input.status || 'active',
        aiConfig: input.aiConfig || {},
        appearance: input.appearance || {},
    });

    await AdminLog.create({
        adminId: input.createdBy,
        action: 'CHATBOT_CREATED',
        entityType: 'chatbot',
        entityId: String(chatbot._id),
        details: {
            chatbotId: publicId,
            name: input.name,
        },
    });

    // Automatically add temporary domain localhost:3000 for testing
    await AllowedDomain.create({
        tenantId: input.tenantId,
        chatbotId: chatbot._id,
        domain: 'http://localhost:3000',
        isEnabled: true,
    }).catch((err) => {
        console.warn('Could not auto-add http://localhost:3000 testing domain:', err);
    });

    return chatbot;
}

/**
 * List chatbots for a tenant.
 * ALL queries must include tenantId to enforce multi-tenant isolation.
 */
export async function listChatbots(tenantId: string): Promise<IChatbot[]> {
    await connectDB();
    return Chatbot.find({
        tenantId,
        isDeleted: false,
    }).sort({ createdAt: -1 });
}

/**
 * Get a single chatbot by internal ID, scoped to a tenant.
 * Throws if the chatbot does not belong to the tenant.
 */
export async function getChatbotById(tenantId: string, chatbotId: string): Promise<IChatbot> {
    await connectDB();
    const chatbot = await Chatbot.findOne({
        _id: chatbotId,
        tenantId,
        isDeleted: false,
    });
    if (!chatbot) {
        throw new Error('Chatbot not found.');
    }
    return chatbot;
}

/**
 * Get a chatbot by its public ID (used by public APIs).
 * Does NOT require tenant context — public consumers only know the public ID.
 */
export async function getChatbotByPublicId(publicId: string): Promise<IChatbot | null> {
    await connectDB();
    return Chatbot.findOne({
        publicId,
        isDeleted: false,
    });
}

/**
 * Update a chatbot, scoped to a tenant.
 */
export async function updateChatbot(
    tenantId: string,
    chatbotId: string,
    updatedBy: string,
    input: UpdateChatbotInput
): Promise<IChatbot> {
    await connectDB();
    const chatbot = await getChatbotById(tenantId, chatbotId);

    if (input.name !== undefined) chatbot.name = input.name;
    if (input.description !== undefined) chatbot.description = input.description;
    if (input.internalIdentifier !== undefined) chatbot.internalIdentifier = input.internalIdentifier;
    if (input.status !== undefined) chatbot.status = input.status;
    if (input.aiConfig) chatbot.aiConfig = { ...(chatbot.aiConfig as unknown as IChatbot['aiConfig']), ...input.aiConfig };
    if (input.appearance) chatbot.appearance = { ...(chatbot.appearance as unknown as IChatbot['appearance']), ...input.appearance };

    await chatbot.save();

    await AdminLog.create({
        adminId: updatedBy,
        action: 'CHATBOT_UPDATED',
        entityType: 'chatbot',
        entityId: String(chatbot._id),
        details: {
            chatbotId: chatbot.publicId,
            name: chatbot.name,
            changedFields: Object.keys(input),
        },
    });

    return chatbot;
}

/**
 * Toggle chatbot active/inactive status.
 */
export async function setChatbotStatus(
    tenantId: string,
    chatbotId: string,
    updatedBy: string,
    status: 'active' | 'inactive'
): Promise<IChatbot> {
    await connectDB();
    const chatbot = await getChatbotById(tenantId, chatbotId);
    chatbot.status = status;
    await chatbot.save();

    await AdminLog.create({
        adminId: updatedBy,
        action: status === 'active' ? 'CHATBOT_ENABLED' : 'CHATBOT_DISABLED',
        entityType: 'chatbot',
        entityId: String(chatbot._id),
        details: {
            chatbotId: chatbot.publicId,
            name: chatbot.name,
        },
    });

    return chatbot;
}

/**
 * Duplicate a chatbot.
 * Copies configuration, appearance, system prompt, and allowed domains.
 * Generates a NEW public chatbot ID.
 */
export async function duplicateChatbot(
    tenantId: string,
    sourceChatbotId: string,
    duplicatedBy: string
): Promise<IChatbot> {
    await connectDB();
    const source = await getChatbotById(tenantId, sourceChatbotId);

    const newChatbot = await createChatbot({
        tenantId,
        createdBy: duplicatedBy,
        name: `${source.name} (Copy)`,
        description: source.description,
        internalIdentifier: source.internalIdentifier ? `${source.internalIdentifier}-copy` : '',
        status: 'inactive', // copies start inactive to avoid accidental exposure
        aiConfig: { ...(source.aiConfig as unknown as IChatbot['aiConfig']) },
        appearance: { ...(source.appearance as unknown as IChatbot['appearance']) },
    });

    // Copy allowed domains
    const sourceDomains = await AllowedDomain.find({
        tenantId,
        chatbotId: source._id,
    }).lean();

    if (sourceDomains.length > 0) {
        await AllowedDomain.insertMany(
            sourceDomains.map((d) => ({
                tenantId,
                chatbotId: newChatbot._id,
                domain: d.domain,
                isEnabled: d.isEnabled,
                verificationToken: '',
                verifiedAt: null,
            }))
        );
    }

    await AdminLog.create({
        adminId: duplicatedBy,
        action: 'CHATBOT_DUPLICATED',
        entityType: 'chatbot',
        entityId: String(newChatbot._id),
        details: {
            sourceChatbotId: String(source._id),
            sourcePublicId: source.publicId,
            newPublicId: newChatbot.publicId,
        },
    });

    return newChatbot;
}

/**
 * Soft-delete a chatbot and all associated records.
 * Configuration remains in DB but is inaccessible.
 */
export async function deleteChatbot(
    tenantId: string,
    chatbotId: string,
    deletedBy: string
): Promise<void> {
    await connectDB();
    const chatbot = await getChatbotById(tenantId, chatbotId);

    // Soft-delete the chatbot
    chatbot.isDeleted = true;
    chatbot.status = 'inactive';
    await chatbot.save();

    // Soft-delete all associated knowledge documents
    await KnowledgeDocument.updateMany(
        { tenantId, chatbotId: chatbot._id, isDeleted: false },
        { $set: { isDeleted: true } }
    );

    // Mark conversations as resolved (messages remain for audit)
    await Conversation.updateMany(
        { tenantId, chatbotId: chatbot._id },
        { $set: { isResolved: true } }
    );

    await AdminLog.create({
        adminId: deletedBy,
        action: 'CHATBOT_DELETED',
        entityType: 'chatbot',
        entityId: String(chatbot._id),
        details: {
            chatbotId: chatbot.publicId,
            name: chatbot.name,
        },
    });
}

/**
 * Resolve the tenant ID for a user/admin.
 * Falls back to the first active tenant for single-tenant deployments.
 */
export async function resolveTenantIdForUser(userId: string): Promise<string> {
    await connectDB();
    const User = (await import('@/lib/models/User')).default;
    const user = await User.findById(userId).select('_id');
    if (!user) {
        throw new Error('User not found.');
    }
    const Tenant = (await import('@/lib/models/Tenant')).default;
    const tenant = await Tenant.findOne({
        ownerId: user._id,
        isActive: true,
    }).lean();

    // If the platform has a single default tenant, use it.
    const defaultTenant = await Tenant.findOne({ isActive: true }).sort({ createdAt: 1 }).lean();

    return String((tenant?._id || defaultTenant?._id || user._id));
}