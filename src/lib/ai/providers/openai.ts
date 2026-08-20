import type { AIProvider, AIResponse, AIChatMessage, AIEmbeddingResponse } from '../types';

/**
 * OpenAI-compatible provider.
 * Uses the Fetch API to call the OpenAI Chat Completions and Embeddings APIs.
 * The API key is always read server-side via `apiKey` parameter and is NEVER exposed.
 */
export class OpenAIProvider implements AIProvider {
    readonly name = 'openai';

    private readonly baseUrl = 'https://api.openai.com/v1';

    async generateChatCompletion(params: {
        messages: AIChatMessage[];
        config: { model: string; temperature: number; maxTokens: number };
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<AIResponse> {
        const { messages, config, apiKey, signal } = params;
        const startedAt = Date.now();

        const res = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: config.model || 'gpt-4o-mini',
                messages,
                temperature: config.temperature ?? 0.3,
                max_tokens: config.maxTokens ?? 500,
            }),
            signal,
        });

        if (!res.ok) {
            const errorBody = await res.text().catch(() => '');
            throw new Error(`OpenAI API error (${res.status}): ${errorBody.slice(0, 500)}`);
        }

        const data = await res.json();
        const choice = data.choices?.[0];

        if (!choice?.message?.content) {
            throw new Error('OpenAI API returned an empty response.');
        }

        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

        return {
            content: choice.message.content,
            tokenUsage: {
                input: usage.prompt_tokens || 0,
                output: usage.completion_tokens || 0,
                total: usage.total_tokens || 0,
            },
            latencyMs: Date.now() - startedAt,
            model: data.model || config.model,
        };
    }

    async generateEmbedding(params: { input: string; apiKey: string }): Promise<AIEmbeddingResponse> {
        const { input, apiKey } = params;
        const startedAt = Date.now();

        // Use a small cost-effective embedding model by default, configurable via env.
        const model = process.env.AI_EMBEDDING_MODEL || 'text-embedding-3-small';

        const res = await fetch(`${this.baseUrl}/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model, input }),
        });

        if (!res.ok) {
            const errorBody = await res.text().catch(() => '');
            throw new Error(`OpenAI Embedding error (${res.status}): ${errorBody.slice(0, 500)}`);
        }

        const data = await res.json();
        const embedding = data.data?.[0]?.embedding;

        if (!Array.isArray(embedding)) {
            throw new Error('OpenAI Embedding API returned an invalid response.');
        }

        return {
            embedding,
            model: data.model || model,
            latencyMs: Date.now() - startedAt,
        };
    }
}