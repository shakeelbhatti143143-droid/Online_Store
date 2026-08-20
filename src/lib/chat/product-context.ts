import Product from '@/lib/models/Product';

const PRODUCT_INTENT = /\b(product|products|shop|buy|purchase|price|cost|stock|available|availability|size|sizes|colour|color|shirt|t-?shirt|watch|headphone|bag|leather|under|budget|recommend)\b/i;
const STOP_WORDS = new Set(['i', 'need', 'want', 'show', 'find', 'me', 'a', 'an', 'the', 'for', 'with', 'and', 'under', 'below', 'less', 'than', 'price', 'products', 'product', 'buy', 'shop']);

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Returns only live catalogue facts that can safely ground a shopping reply. */
export async function findProductContext(message: string): Promise<{ context: string; searched: boolean }> {
    if (!PRODUCT_INTENT.test(message)) return { context: '', searched: false };

    const maxPrice = message.match(/(?:under|below|less than)\s*\$?\s*(\d+(?:\.\d{1,2})?)/i);
    const terms = message.toLowerCase().match(/[a-z0-9-]{3,}/g)?.filter((term) => !STOP_WORDS.has(term)) || [];
    const filter: Record<string, unknown> = { isActive: true };
    if (maxPrice) filter.price = { $lte: Number(maxPrice[1]) };
    if (terms.length) {
        const pattern = terms.map(escapeRegex).join('|');
        filter.$or = [
            { title: { $regex: pattern, $options: 'i' } },
            { shortDescription: { $regex: pattern, $options: 'i' } },
            { tags: { $regex: pattern, $options: 'i' } },
            { features: { $regex: pattern, $options: 'i' } },
        ];
    }

    const products = await Product.find(filter)
        .select('title slug price stockQuantity shortDescription features tags')
        .sort({ isFeatured: -1, isBestSeller: -1 })
        .limit(6)
        .lean();

    if (!products.length) return { context: '', searched: true };

    return {
        searched: true,
        context: products.map((product) => {
            const availability = product.stockQuantity > 0 ? `in stock (${product.stockQuantity} available)` : 'currently out of stock';
            const features = product.features?.slice(0, 3).join(', ') || product.tags?.slice(0, 3).join(', ');
            return `- ${product.title} | $${product.price.toFixed(2)} | ${availability}${product.shortDescription ? ` | ${product.shortDescription}` : ''}${features ? ` | Features: ${features}` : ''} | /products/${product.slug}`;
        }).join('\n'),
    };
}
