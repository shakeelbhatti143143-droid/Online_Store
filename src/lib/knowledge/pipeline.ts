import type { AIProvider } from '@/lib/ai/types';

/**
 * Estimate token count for a piece of text.
 * Rough heuristic: ~4 characters per token for English text.
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Split extracted text into semantic chunks.
 * Uses a sliding window with overlap to preserve context across boundaries.
 */
export function splitIntoChunks(text: string, maxChunkLength = 1000, overlap = 150): string[] {
    if (!text || !text.trim()) return [];

    // Normalize whitespace and split into paragraphs
    const normalized = text.replace(/\r\n/g, '\n').trim();
    const paragraphs = normalized
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

    const chunks: string[] = [];
    let current = '';

    for (const paragraph of paragraphs) {
        // If a single paragraph is longer than max, split it on sentence boundaries
        if (paragraph.length > maxChunkLength) {
            // Flush current chunk first
            if (current) {
                chunks.push(current);
                current = '';
            }
            // Split long paragraph into segments
            const sentences = paragraph.split(/(?<=[.!?])\s+/);
            let segment = '';
            for (const sentence of sentences) {
                if ((segment + ' ' + sentence).trim().length > maxChunkLength) {
                    if (segment) {
                        chunks.push(segment.trim());
                        segment = '';
                    }
                    // If a single sentence exceeds max, hard-split it
                    if (sentence.length > maxChunkLength) {
                        for (let i = 0; i < sentence.length; i += maxChunkLength) {
                            chunks.push(sentence.slice(i, i + maxChunkLength).trim());
                        }
                    } else {
                        segment = sentence;
                    }
                } else {
                    segment = (segment + ' ' + sentence).trim();
                }
            }
            if (segment) chunks.push(segment.trim());
            continue;
        }

        const combined = current ? `${current}\n\n${paragraph}` : paragraph;
        if (combined.length > maxChunkLength && current) {
            chunks.push(current.trim());
            // Keep overlap: last 150 chars of the previous chunk become the start of the next
            const overlapText = current.slice(-overlap);
            current = overlapText ? `${overlapText}\n\n${paragraph}` : paragraph;
        } else {
            current = combined;
        }
    }

    if (current.trim()) chunks.push(current.trim());

    return chunks.filter((c) => c.length > 0);
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface RetrievedChunk {
    documentId: string;
    fileName: string;
    content: string;
    score: number;
    chunkIndex: number;
}

/**
 * Vector similarity search.
 * Given a query embedding, search all knowledge chunks for a chatbot
 * and return the most similar ones.
 */
export async function searchKnowledge(
    chatbotId: string,
    queryEmbedding: number[],
    limit = 5
): Promise<RetrievedChunk[]> {
    const KnowledgeDocument = (await import('@/lib/models/KnowledgeDocument')).default;

    // Only retrieve documents from THIS chatbot, enforcing tenant isolation downstream.
    const docs = await KnowledgeDocument.find({
        chatbotId,
        status: 'completed',
        isDeleted: false,
    })
        .select('_id tenantId fileName chunks')
        .lean();

    const results: RetrievedChunk[] = [];

    for (const doc of docs) {
        for (const chunk of doc.chunks || []) {
            if (!chunk.embedding || chunk.embedding.length === 0) continue;
            const score = cosineSimilarity(queryEmbedding, chunk.embedding);
            results.push({
                documentId: String(doc._id),
                fileName: doc.fileName || 'Knowledge Document',
                content: chunk.content,
                score,
                chunkIndex: chunk.index || 0,
            });
        }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
}

/**
 * Build the AI context string from retrieved chunks.
 */
export function buildKnowledgeContext(chunks: RetrievedChunk[]): string {
    if (!chunks || chunks.length === 0) return '';

    const sections = chunks.map(
        (c, i) => `[Source ${i + 1}: ${c.fileName}]\n${c.content}`
    );

    return sections.join('\n\n---\n\n');
}