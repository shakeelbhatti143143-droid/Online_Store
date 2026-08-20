/**
 * Document text extraction service.
 * Supports PDF, TXT, DOC, DOCX, and CSV files.
 * The parsed text is later used by the knowledge processing pipeline for
 * embedding generation and RAG retrieval.
 */

interface ParsedDocument {
    text: string;
    fileName: string;
    fileType: string;
}

/**
 * Extract text from an uploaded file buffer.
 * @param buffer       The raw file bytes.
 * @param fileName     Original file name.
 * @param mimeType     Optional MIME type from the upload.
 */
export async function extractTextFromFile(
    buffer: Buffer,
    fileName: string,
    mimeType?: string
): Promise<ParsedDocument> {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const type = mimeType || ext;

    if (ext === 'pdf' || type === 'application/pdf') {
        return extractPdf(buffer, fileName);
    }
    if (ext === 'txt' || type === 'text/plain') {
        return extractTxt(buffer, fileName);
    }
    if (ext === 'docx' || type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return extractDocx(buffer, fileName);
    }
    if (ext === 'doc' || type === 'application/msword') {
        return extractDoc(buffer, fileName);
    }
    if (ext === 'csv' || type === 'text/csv') {
        return extractCsv(buffer, fileName);
    }

    // Fallback: attempt plain text
    const text = buffer.toString('utf8');
    if (!text.trim()) {
        throw new Error(`Unsupported file type: ${ext || 'unknown'}`);
    }
    return { text, fileName, fileType: ext || 'text' };
}

/**
 * Extract text from a website URL.
 * Fetches the page and converts the HTML to plain text.
 */
export async function extractTextFromUrl(url: string): Promise<ParsedDocument> {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'ChatbotKnowledgeBot/1.0 (+https://your-platform.com)',
        },
        signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch URL (${res.status}): ${url}`);
    }

    const html = await res.text();

    // Strip common tags and extract readable text (simple HTML-to-text).
    const text = html
        // Remove script/style contents
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        // Replace tags with spaces
        .replace(/<[^>]+>/g, ' ')
        // Decode common entities
        .replace(/&nbsp;/gi, ' ')
        .replace(/&/gi, '&')
        .replace(/</gi, '<')
        .replace(/>/gi, '>')
        .replace(/"/gi, '"')
        .replace(/&#39;/gi, "'")
        // Collapse whitespace
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) {
        throw new Error('No readable content found at the provided URL.');
    }

    return { text, fileName: url, fileType: 'url' };
}

/**
 * Extract text from plain text input.
 */
export function extractTextFromPlain(text: string): ParsedDocument {
    if (!text || !text.trim()) {
        throw new Error('Text content cannot be empty.');
    }
    return { text: text.trim(), fileName: 'Plain Text Input', fileType: 'text' };
}

// --- Individual format handlers -----------------------------------------

async function extractPdf(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
    // Dynamic import to keep the bundle lean; only loaded when a PDF is uploaded.
    // pdf-parse v2 exports a `parse` named function from its ESM build.
    const pdfParseModule = (await import('pdf-parse')) as unknown as {
        default?: { parse(buffer: Buffer): Promise<{ text: string }> };
        parse?: (buffer: Buffer) => Promise<{ text: string }>;
    };
    const parser = pdfParseModule.parse || pdfParseModule.default?.parse;
    if (!parser) {
        throw new Error('PDF parser is not available.');
    }
    const result = await parser(buffer);
    return {
        text: (result.text || '').trim(),
        fileName,
        fileType: 'pdf',
    };
}

async function extractDocx(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return {
        text: (result.value || '').trim(),
        fileName,
        fileType: 'docx',
    };
}

async function extractDoc(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
    // Legacy .doc binary format is handled by reading the text stream.
    const raw = buffer.toString('latin1');
    const text = raw
        // Remove binary/non-printable characters
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!text) {
        throw new Error('Could not extract text from .doc file. Please convert to .docx or PDF.');
    }
    return { text, fileName, fileType: 'doc' };
}

async function extractTxt(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
    return {
        text: buffer.toString('utf8').trim(),
        fileName,
        fileType: 'txt',
    };
}

async function extractCsv(buffer: Buffer, fileName: string): Promise<ParsedDocument> {
    const { parse } = await import('csv-parse/sync');
    const records = parse(buffer.toString('utf8'), {
        columns: false,
        skip_empty_lines: true,
        relax_column_count: true,
    }) as string[][];

    if (records.length === 0) {
        throw new Error('CSV file is empty.');
    }

    // Convert each row to readable text for indexing
    const text = records
        .map((row) => row.map((cell) => String(cell || '')).join(' | '))
        .join('\n');

    return {
        text,
        fileName,
        fileType: 'csv',
    };
}