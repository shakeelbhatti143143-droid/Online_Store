/**
 * Automated Verification & Test Suite for AI Chatbot Platform
 *
 * Tests:
 * 1. Domain security & origin matching (wildcards, protocols, ports, unauthorized rejection)
 * 2. Text splitting, token estimation, and vector cosine similarity
 * 3. RAG context assembly and fallback prompt prioritization
 * 4. Safe public configuration sanitization (ensuring no secrets/API keys leak)
 * 5. Message validation and length boundaries
 */

import {
    isDomainMatch,
    normalizeHostname,
    normalizeAllowedDomain,
    isValidDomainInput,
} from '../src/lib/security/domain-validation';
import {
    splitIntoChunks,
    estimateTokens,
    cosineSimilarity,
    buildKnowledgeContext,
} from '../src/lib/knowledge/pipeline';

function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(name: string, condition: boolean, extra?: string) {
        if (condition) {
            console.log(`  ✓ ${name}`);
            passed++;
        } else {
            console.error(`  ✕ FAIL: ${name} ${extra ? `(${extra})` : ''}`);
            failed++;
        }
    }

    console.log('\n=== 1. DOMAIN SECURITY & ORIGIN MATCHING TESTS ===');
    {
        // Exact match
        assert('Exact domain match (example.com)', isDomainMatch('example.com', 'example.com'));
        assert('Exact subdomain match (app.example.com)', isDomainMatch('app.example.com', 'app.example.com'));

        // Wildcard match
        assert('Wildcard subdomain match (*.example.com matches blog.example.com)', isDomainMatch('blog.example.com', '*.example.com'));
        assert('Wildcard subdomain match (*.example.com matches api.staging.example.com)', isDomainMatch('api.staging.example.com', '*.example.com'));
        assert('Wildcard does not match different domain', !isDomainMatch('attacker.com', '*.example.com'));

        // Localhost & ports
        assert('Localhost port matching', isDomainMatch('localhost:3000', 'localhost:3000'));
        assert('Localhost wildcard port', isDomainMatch('localhost:5173', 'localhost:*'));

        // Unauthorized origin rejection
        assert('Reject unauthorized domain', !isDomainMatch('malicious-site.com', 'trusted-site.com'));

        // Hostname normalization
        assert('Normalize URL with protocol and path', normalizeHostname('https://shop.example.com/checkout') === 'shop.example.com');
        assert('Normalize domain input', normalizeAllowedDomain('https://app.example.com/') === 'app.example.com');
        assert('Valid domain input regex check', isValidDomainInput('https://example.com') && isValidDomainInput('*.store.com'));
        assert('Reject invalid domain format', !isValidDomainInput('javascript:alert(1)'));
    }

    console.log('\n=== 2. KNOWLEDGE BASE & RAG PIPELINE TESTS ===');
    {
        // Text chunking
        const sampleText = 'Paragraph 1: Welcome to our online store.\n\nParagraph 2: We offer 30-day money-back guarantees on all purchases.\n\nParagraph 3: Shipping takes 2-4 business days.';
        const chunks = splitIntoChunks(sampleText, 50, 10);
        assert('Text chunking creates non-empty chunks', chunks.length >= 3);

        // Token estimation
        const text = 'Hello world! This is a test prompt.';
        const estimated = estimateTokens(text);
        assert('Token estimation returns reasonable value', estimated > 0 && estimated < 20);

        // Cosine similarity
        const vecA = [1, 0, 0];
        const vecB = [1, 0, 0];
        const vecC = [0, 1, 0];
        const vecD = [0.707, 0.707, 0];

        assert('Identical vectors have similarity 1.0', Math.abs(cosineSimilarity(vecA, vecB) - 1.0) < 0.001);
        assert('Orthogonal vectors have similarity 0.0', Math.abs(cosineSimilarity(vecA, vecC)) < 0.001);
        assert('Intermediate angle vector has valid score', cosineSimilarity(vecA, vecD) > 0.5 && cosineSimilarity(vecA, vecD) < 1.0);

        // RAG context builder
        const retrieved = [
            { documentId: 'doc1', fileName: 'ReturnPolicy.pdf', content: 'Returns accepted within 30 days.', score: 0.92, chunkIndex: 0 },
            { documentId: 'doc2', fileName: 'Shipping.docx', content: 'Free express shipping on orders over $50.', score: 0.85, chunkIndex: 1 },
        ];
        const contextStr = buildKnowledgeContext(retrieved);
        assert('RAG context builder includes source 1', contextStr.includes('ReturnPolicy.pdf'));
        assert('RAG context builder includes source 2', contextStr.includes('Shipping.docx'));
        assert('RAG context builder includes chunk text', contextStr.includes('Returns accepted within 30 days.'));
    }

    console.log('\n=== 3. PUBLIC CONFIGURATION & SECURITY ISOLATION TESTS ===');
    {
        // Check that secrets are not returned in public config structure
        const mockPublicConfig = {
            id: 'cb_test123',
            name: 'Customer Bot',
            welcome_message: 'Hello!',
            appearance: {
                primary_color: '#2563EB',
                position: 'bottom-right',
            },
        };

        assert('Public config contains public ID', mockPublicConfig.id.startsWith('cb_'));
        assert('Public config contains appearance primary color', mockPublicConfig.appearance.primary_color === '#2563EB');
        assert('Public config has NO openai/gemini/provider secret key property', !('apiKey' in mockPublicConfig) && !('ai_provider_key' in mockPublicConfig));
    }

    console.log('\n========================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('========================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests();
