import type {
    AIProvider,
    AIResponse,
    AIChatMessage,
    AIEmbeddingResponse,
} from '../types';

export class GeminiProvider implements AIProvider {
    readonly name = 'gemini';

    private readonly baseUrl =
        'https://generativelanguage.googleapis.com/v1beta';

    async generateChatCompletion(params: {
        messages: AIChatMessage[];
        config: {
            model: string;
            temperature: number;
            maxTokens: number;
        };
        apiKey: string;
        signal?: AbortSignal;
    }): Promise<AIResponse> {
        const {
            messages,
            config,
            apiKey,
            signal,
        } = params;

        const startedAt = Date.now();

        const model =
            config.model || 'gemini-3.1-flash-lite';

        const systemMessages = messages.filter(
            (message) => message.role === 'system'
        );

        const conversationMessages =
            messages.filter(
                (message) => message.role !== 'system'
            );

        const systemInstruction =
            systemMessages
                .map((message) => message.content)
                .join('\n\n');

        const contents = conversationMessages.map(
            (message) => ({
                role:
                    message.role === 'assistant'
                        ? 'model'
                        : 'user',
                parts: [
                    {
                        text: message.content,
                    },
                ],
            })
        );

        const url =
            `${this.baseUrl}/models/${encodeURIComponent(model)}:generateContent` +
            `?key=${encodeURIComponent(apiKey)}`;

        const body: Record<string, unknown> = {
            contents,
            generationConfig: {
                maxOutputTokens:
                    config.maxTokens ?? 500,
            },
        };

        if (systemInstruction) {
            body.systemInstruction = {
                parts: [
                    {
                        text: systemInstruction,
                    },
                ],
            };
        }

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal,
        });

        if (!res.ok) {
            const errorBody = await res
                .text()
                .catch(() => '');

            throw new Error(
                `Gemini API error (${res.status}): ${errorBody.slice(
                    0,
                    1000
                )}`
            );
        }

        const data = await res.json();

        const content =
            data.candidates?.[0]?.content?.parts
                ?.map(
                    (part: { text?: string }) =>
                        part.text || ''
                )
                .join('') || '';

        if (!content) {
            throw new Error(
                'Gemini API returned an empty response.'
            );
        }

        const usage =
            data.usageMetadata || {};

        const inputTokens =
            usage.promptTokenCount || 0;

        const outputTokens =
            usage.candidatesTokenCount || 0;

        const totalTokens =
            usage.totalTokenCount ||
            inputTokens + outputTokens;

        return {
            content,
            tokenUsage: {
                input: inputTokens,
                output: outputTokens,
                total: totalTokens,
            },
            latencyMs:
                Date.now() - startedAt,
            model:
                data.modelVersion || model,
        };
    }

    async generateEmbedding(params: {
        input: string;
        apiKey: string;
    }): Promise<AIEmbeddingResponse> {
        throw new Error(
            'Gemini embeddings are not configured in this provider yet.'
        );
    }
}