import type { ICAIConfig } from '@/lib/models/Chatbot';

export interface AIResponse {
    content: string;
    tokenUsage: {
        input: number;
        output: number;
        total: number;
    };
    latencyMs: number;
    model: string;
}

export interface AIChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface AIEmbeddingResponse {
    embedding: number[];
    model: string;
    latencyMs: number;
}

/**
 * Abstract AI provider interface.
 * Every provider must implement chat completion and embedding generation.
 */
export interface AIProvider {
    readonly name: string;

    generateChatCompletion(params: {
        messages: AIChatMessage[];
        config: Pick<
            ICAIConfig,
            'model' | 'temperature' | 'maxTokens'
        >;
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<AIResponse>;

    generateEmbedding(params: {
        input: string;
        apiKey: string;
    }): Promise<AIEmbeddingResponse>;
}

/**
 * Provider registry.
 *
 * The provider name must match:
 * chatbot.aiConfig.provider
 */

import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';

const providerRegistry: Record<
    string,
    AIProvider
> = {
    openai: new OpenAIProvider(),
    gemini: new GeminiProvider(),
};

export function getAIProvider(
    name: string
): AIProvider {
    const provider =
        providerRegistry[name];

    if (!provider) {
        throw new Error(
            `Unknown AI provider: ${name}`
        );
    }

    return provider;
}

export function isProviderConfigured(): boolean {
    return Boolean(
        process.env.AI_PROVIDER_API_KEY ||
            process.env.OPENAI_API_KEY ||
            process.env.GEMINI_API_KEY
    );
}