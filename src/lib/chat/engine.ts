import connectDB from '@/lib/mongodb';
import Chatbot from '@/lib/models/Chatbot';
import Conversation from '@/lib/models/Conversation';
import Message from '@/lib/models/Message';
import { getAIProvider } from '@/lib/ai/types';
import type { AIChatMessage } from '@/lib/ai/types';
import { generateQueryEmbedding } from '@/lib/knowledge/processor';
import {
    searchKnowledge,
    buildKnowledgeContext,
    type RetrievedChunk,
} from '@/lib/knowledge/pipeline';
import { isOriginAuthorized } from '@/lib/security/domain-validation';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Hard limits
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_CONVERSATION_MESSAGES = 100;

export interface SendMessageParams {
    publicChatbotId: string;
    conversationId?: string;
    visitorId: string;
    sessionId: string;
    message: string;
    origin: string | null;
    request: { headers: { get(name: string): string | null } };
}

export interface SendMessageResult {
    conversationId: string;
    message: string;
    sources: RetrievedChunk[];
}

function resolveApiKey(providerName: string): string {
    const keys: Record<string, string | undefined> = {
        openai: process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
    };

    const key = keys[providerName];

    if (!key) {
        throw new Error(
            `Missing API key for provider "${providerName}". ` +
            `Please add the required API key to your .env.local file.`
        );
    }

    return key;
}

/**
 * Main public chat engine.
 */
export async function sendChatMessage(
    params: SendMessageParams
): Promise<SendMessageResult> {
    await connectDB();

    // --- 1. Validate chatbot ---
    const chatbot = await Chatbot.findOne({
        publicId: params.publicChatbotId,
        isDeleted: false,
    });

    if (!chatbot) {
        throw new ChatError('Chatbot not found.', 404);
    }

    // --- 2. Check chatbot status ---
    if (chatbot.status !== 'active') {
        throw new ChatError('This chatbot is currently disabled.', 403);
    }

    // --- Debug logging for public chatbot ---
    console.log('========== PUBLIC CHATBOT ==========');
    console.log('Chatbot ID:', chatbot.publicId);
    console.log('Provider:', chatbot.aiConfig.provider);
    console.log('Model:', chatbot.aiConfig.model);
    console.log('====================================');

    // --- 3. Check allowed domain ---
    const domainCheck = await isOriginAuthorized(
        chatbot._id,
        params.origin
    );

    if (!domainCheck.authorized) {
        throw new ChatError(
            'This website is not authorized to use this chatbot.',
            403
        );
    }

    // --- 4. Validate message ---
    const trimmedMessage = (params.message || '').trim();

    if (!trimmedMessage) {
        throw new ChatError('Message cannot be empty.', 400);
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
        throw new ChatError('Your message is too long.', 400);
    }

    // --- 5. Rate limiting ---
    const clientIp = getClientIp(params.request);
    const rateKey = `chat:${params.publicChatbotId}:${clientIp}`;

    const rate = rateLimit(rateKey, 30, 60_000);

    if (!rate.allowed) {
        throw new ChatError(
            'Too many messages. Please try again later.',
            429
        );
    }

    // --- 6. Create/find conversation ---
    let conversation: InstanceType<typeof Conversation> | null = null;

    if (params.conversationId) {
        conversation = await Conversation.findOne({
            _id: params.conversationId,
            chatbotId: chatbot._id,
            tenantId: chatbot.tenantId,
        });
    }

    if (!conversation) {
        conversation = await Conversation.create({
            tenantId: chatbot.tenantId,
            chatbotId: chatbot._id,
            visitorId: params.visitorId,
            sessionId: params.sessionId,
            startedAt: new Date(),
            lastMessageAt: new Date(),
            messageCount: 0,
            metadata: {},
        });
    } else {
        if (conversation.messageCount >= MAX_CONVERSATION_MESSAGES) {
            throw new ChatError(
                'This conversation has reached its message limit. Please start a new conversation.',
                400
            );
        }
    }

    // --- 7. Save user message ---
    await Message.create({
        tenantId: chatbot.tenantId,
        conversationId: conversation._id,
        role: 'user',
        content: trimmedMessage,
        metadata: {
            sessionId: params.sessionId,
            visitorId: params.visitorId,
        },
    });

    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    // --- 8. Load conversation history ---
    const historyMessages = await Message.find({
        conversationId: conversation._id,
        tenantId: chatbot.tenantId,
    })
        .sort({ createdAt: 1 })
        .limit(10)
        .lean();

    // --- 9. RAG ---
    let retrievedChunks: RetrievedChunk[] = [];
    let knowledgeContext = '';

    try {
        const queryEmbedding = await generateQueryEmbedding(
            trimmedMessage,
            chatbot.aiConfig.provider
        );

        retrievedChunks = await searchKnowledge(
            String(chatbot._id),
            queryEmbedding,
            5
        );

        knowledgeContext = buildKnowledgeContext(
            retrievedChunks
        );
    } catch (error) {
        console.warn(
            '[chat-engine] RAG search failed:',
            error instanceof Error ? error.message : error
        );
    }

    // --- 10. Build AI messages ---
    // NOTE: The AI provider is ALWAYS called, even when RAG finds no
    // knowledge. The fallbackMessage is passed to the AI as guidance,
    // NOT used as a hard short-circuit that hides provider errors.
    const aiMessages: AIChatMessage[] = [];

    let systemPrompt =
        chatbot.aiConfig.systemPrompt || '';

    if (knowledgeContext) {
        systemPrompt +=
            `\n\nRelevant Knowledge:\n${knowledgeContext}` +
            `\n\nPrioritize the supplied knowledge. ` +
            `If the answer is not contained in the available knowledge, ` +
            `follow the configured fallback behavior rather than guessing.`;
    } else {
        const fallbackMessage =
            chatbot.aiConfig.fallbackMessage ||
            'I could not find that information in my available knowledge. Please contact support for further assistance.';

        systemPrompt +=
            `\n\nNo knowledge base matches were found for this query. ` +
            `Respond naturally to the user's message. ` +
            `If you cannot answer, use this fallback message: "${fallbackMessage}"`;
    }

    aiMessages.push({
        role: 'system',
        content: systemPrompt,
    });

    for (const m of historyMessages) {
        if (
            m.role === 'user' ||
            m.role === 'assistant'
        ) {
            aiMessages.push({
                role: m.role,
                content: String(m.content),
            });
        }
    }

    // --- 12. Call AI provider ---
    const provider = getAIProvider(
        chatbot.aiConfig.provider
    );

    const apiKey = resolveApiKey(provider.name);

    console.log(
        '[chat-engine] AI provider:',
        provider.name
    );

    console.log(
        '[chat-engine] AI model:',
        chatbot.aiConfig.model
    );

    console.log(
        '[chat-engine] API key configured:',
        Boolean(apiKey)
    );

    let aiResponse;

    try {
        aiResponse =
            await provider.generateChatCompletion({
                messages: aiMessages,
                config: {
                    model: chatbot.aiConfig.model,
                    temperature:
                        chatbot.aiConfig.temperature,
                    maxTokens:
                        chatbot.aiConfig.maxTokens,
                },
                apiKey,
            });
    } catch (error) {
        console.error(
            '[chat-engine] AI provider error:',
            error
        );

        const errorMessage =
            error instanceof Error
                ? error.message
                : String(error);

        throw new ChatError(
            `AI provider error: ${errorMessage}`,
            503
        );
    }

    // --- 13. Save assistant message ---
    await Message.create({
        tenantId: chatbot.tenantId,
        conversationId: conversation._id,
        role: 'assistant',
        content: aiResponse.content,
        tokenUsage: aiResponse.tokenUsage.total,
        latencyMs: aiResponse.latencyMs,
        sources: retrievedChunks.map((c) => ({
            documentId: c.documentId,
            fileName: c.fileName,
            chunkIndex: c.chunkIndex,
            score: c.score,
        })),
        metadata: {
            model: aiResponse.model,
        },
    });

    // --- 14. Update analytics ---
    conversation.tokenUsage +=
        aiResponse.tokenUsage.total;

    conversation.aiCostEstimate +=
        estimateAICost(aiResponse.tokenUsage);

    conversation.aiResponseTimeMs =
        aiResponse.latencyMs;

    conversation.messageCount += 1;
    conversation.lastMessageAt = new Date();

    await conversation.save();

    chatbot.lastActiveAt = new Date();
    await chatbot.save();

    return {
        conversationId: String(conversation._id),
        message: aiResponse.content,
        sources: retrievedChunks,
    };
}

/**
 * Send a test message from the admin dashboard.
 */
export async function sendTestMessage(params: {
    publicChatbotId: string;
    message: string;
}): Promise<SendMessageResult> {
    await connectDB();

    const chatbot = await Chatbot.findOne({
        publicId: params.publicChatbotId,
        isDeleted: false,
    });

    if (!chatbot) {
        throw new ChatError(
            'Chatbot not found.',
            404
        );
    }

    if (chatbot.status !== 'active') {
        throw new ChatError(
            'This chatbot is currently disabled.',
            403
        );
    }

    const trimmed =
        (params.message || '').trim();

    if (!trimmed) {
        throw new ChatError(
            'Message cannot be empty.',
            400
        );
    }

    if (
        trimmed.length >
        MAX_MESSAGE_LENGTH
    ) {
        throw new ChatError(
            'Your message is too long.',
            400
        );
    }

    // --- RAG ---
    let retrievedChunks: RetrievedChunk[] = [];
    let knowledgeContext = '';

    try {
        const queryEmbedding =
            await generateQueryEmbedding(
                trimmed,
                chatbot.aiConfig.provider
            );

        retrievedChunks =
            await searchKnowledge(
                String(chatbot._id),
                queryEmbedding,
                5
            );

        knowledgeContext =
            buildKnowledgeContext(
                retrievedChunks
            );
    } catch (error) {
        console.warn(
            '[chat-engine] test RAG failed:',
            error instanceof Error
                ? error.message
                : error
        );
    }

    // --- Build messages ---
    const aiMessages: AIChatMessage[] = [];

    let systemPrompt =
        chatbot.aiConfig.systemPrompt || '';

    if (knowledgeContext) {
        systemPrompt +=
            `\n\nRelevant Knowledge:\n${knowledgeContext}`;
    }

    aiMessages.push({
        role: 'system',
        content: systemPrompt,
    });

    aiMessages.push({
        role: 'user',
        content: trimmed,
    });

    // --- AI provider ---
    const provider = getAIProvider(
        chatbot.aiConfig.provider
    );

    const apiKey = resolveApiKey(
        provider.name
    );

    console.log(
        '[chat-engine] TEST provider:',
        provider.name
    );

    console.log(
        '[chat-engine] TEST model:',
        chatbot.aiConfig.model
    );

    console.log(
        '[chat-engine] TEST API key configured:',
        Boolean(apiKey)
    );

    let aiResponse;

    try {
        aiResponse =
            await provider.generateChatCompletion({
                messages: aiMessages,
                config: {
                    model:
                        chatbot.aiConfig.model,
                    temperature:
                        chatbot.aiConfig.temperature,
                    maxTokens:
                        chatbot.aiConfig.maxTokens,
                },
                apiKey,
            });
    } catch (error) {
        console.error(
            '[chat-engine] test AI error:',
            error
        );

        const errorMessage =
            error instanceof Error
                ? error.message
                : String(error);

        throw new ChatError(
            `AI provider error: ${errorMessage}`,
            503
        );
    }

    return {
        conversationId: '',
        message: aiResponse.content,
        sources: retrievedChunks,
    };
}

/**
 * Estimate AI cost.
 */
function estimateAICost(usage: {
    input: number;
    output: number;
    total: number;
}): number {
    const inputCost =
        (usage.input / 1_000_000) * 0.15;

    const outputCost =
        (usage.output / 1_000_000) * 0.60;

    return inputCost + outputCost;
}

/**
 * Custom error class.
 */
export class ChatError extends Error {
    status: number;

    constructor(
        message: string,
        status: number = 500
    ) {
        super(message);
        this.status = status;
    }
}

/**
 * Get conversation messages.
 */
export async function getConversationMessages(
    tenantId: string,
    conversationId: string
): Promise<
    Array<Record<string, unknown>>
> {
    await connectDB();

    const conversation =
        await Conversation.findOne({
            _id: conversationId,
            tenantId,
        });

    if (!conversation) {
        throw new ChatError(
            'Conversation not found.',
            404
        );
    }

    const messages =
        await Message.find({
            conversationId,
            tenantId,
        })
            .sort({ createdAt: 1 })
            .lean();

    return messages.map((m) => ({
        id: String(m._id),
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        tokenUsage: m.tokenUsage,
        sources: m.sources,
    }));
}