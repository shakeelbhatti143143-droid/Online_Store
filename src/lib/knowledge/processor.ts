import connectDB from '@/lib/mongodb';
import KnowledgeDocument, { IKnowledgeDocument } from '@/lib/models/KnowledgeDocument';
import { getAIProvider } from '@/lib/ai/types';
import { extractTextFromFile, extractTextFromUrl, extractTextFromPlain } from './extract';
import { splitIntoChunks, estimateTokens } from './pipeline';

/**
 * Retrieve the API key for a given AI provider.
 * The key is resolved from server-side environment variables.
 * Per-tenant keys could be stored in a `TenantCredential` collection.
 */
function resolveApiKey(providerName: string): string {
    const keys: Record<string, string | undefined> = {
        openai: process.env.AI_PROVIDER_API_KEY || process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
    };
    const key = keys[providerName];
    if (!key) {
        throw new Error(`AI provider "${providerName}" is not configured. Set the API key in environment variables.`);
    }
    return key;
}

/**
 * Process a knowledge document end-to-end:
 *   1. Extract text (based on source type)
 *   2. Split into chunks
 *   3. Generate embeddings for every chunk
 *   4. Persist chunks + status in the KnowledgeDocument record
 *
 * Each document is scoped to a specific chatbot (and tenant), so a chatbot
 * can never access another chatbot's knowledge.
 */
export async function processKnowledgeDocument(
    documentId: string,
    opts?: {
        file?: { buffer: Buffer; fileName: string; mimeType?: string };
        url?: string;
        text?: string;
    }
): Promise<IKnowledgeDocument> {
    await connectDB();

    const doc = await KnowledgeDocument.findById(documentId);
    if (!doc) {
        throw new Error('Knowledge document not found.');
    }

    // Mark as processing
    doc.status = 'processing';
    doc.errorMessage = '';
    doc.chunks = [];
    doc.chunkCount = 0;
    doc.vectorCount = 0;
    await doc.save();

    try {
        // Step 1: Extract text
        let rawText = '';
        let fileName = doc.fileName || '';
        let fileType = doc.fileType || '';

        if (opts?.file) {
            const parsed = await extractTextFromFile(
                opts.file.buffer,
                opts.file.fileName,
                opts.file.mimeType
            );
            rawText = parsed.text;
            fileName = parsed.fileName;
            fileType = parsed.fileType;
        } else if (opts?.url || doc.sourceType === 'url') {
            const parsed = await extractTextFromUrl(opts?.url || doc.sourceUrl);
            rawText = parsed.text;
            fileName = parsed.fileName;
            fileType = parsed.fileType;
        } else if (opts?.text || doc.sourceType === 'text') {
            const parsed = extractTextFromPlain(opts?.text || doc.content);
            rawText = parsed.text;
            fileName = parsed.fileName;
            fileType = parsed.fileType;
        }

        if (!rawText.trim()) {
            throw new Error('No text content was extracted from this document.');
        }

        // Step 2: Split into chunks
        const chunks = splitIntoChunks(rawText);

        if (chunks.length === 0) {
            throw new Error('Document text could not be split into chunks.');
        }

        // Step 3: Generate embeddings
        const provider = getAIProvider('openai'); // future: read from chatbot.aiConfig.provider
        const apiKey = resolveApiKey(provider.name);

        const embeddedChunks: Array<{
            index: number;
            content: string;
            embedding: number[];
            tokenCount: number;
        }> = [];

        // Embed each chunk (sequential to avoid rate limits; batch for performance)
        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i];
            const embeddingRes = await provider.generateEmbedding({
                input: chunkText,
                apiKey,
            });
            embeddedChunks.push({
                index: i,
                content: chunkText,
                embedding: embeddingRes.embedding,
                tokenCount: estimateTokens(chunkText),
            });
        }

        // Step 4: Persist
        doc.fileName = fileName;
        doc.fileType = fileType;
        doc.content = rawText;
        doc.chunks = embeddedChunks;
        doc.chunkCount = embeddedChunks.length;
        doc.vectorCount = embeddedChunks.length;
        doc.status = 'completed';
        doc.errorMessage = '';
        await doc.save();

        return doc;
    } catch (error) {
        doc.status = 'failed';
        doc.errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
        await doc.save();
        throw error;
    }
}

/**
 * Generate an embedding for a query string.
 * Used by the chat endpoint for RAG retrieval.
 */
export async function generateQueryEmbedding(query: string, providerName = 'openai'): Promise<number[]> {
    const provider = getAIProvider(providerName);
    const apiKey = resolveApiKey(providerName);
    const res = await provider.generateEmbedding({ input: query, apiKey });
    return res.embedding;
}