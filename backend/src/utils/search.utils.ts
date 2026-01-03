import mongoose from 'mongoose';
import Product from '../models/Product';
import Category from '../models/Category';
import Brand from '../models/Brand';

/**
 * Calculate the Levenshtein distance between two strings
 * Higher number = less similarity
 */
export function levenshteinDistance(s1: string, s2: string): number {
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];

    for (let i = 0; i <= len1; i++) matrix[i] = [i];
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,       // Deletion
                matrix[i][j - 1] + 1,       // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }
    return matrix[len1][len2];
}

/**
 * Build a dictionary of words relevant to a specific store
 * Extracts keywords from product names, tags, categories, and brands
 */
export async function buildStoreDictionary(storeId: string): Promise<Set<string>> {
    const dictionary = new Set<string>();
    const storeObjectId = new mongoose.Types.ObjectId(storeId);

    // Get product metadata
    const products = await Product.find({ storeId: storeObjectId, isActive: true })
        .select('name tags')
        .lean();

    products.forEach(p => {
        // From name
        p.name.toLowerCase().split(/[\s&,.-]+/).forEach(word => {
            if (word.length > 3) dictionary.add(word);
        });
        // From tags
        p.tags.forEach(tag => {
            tag.toLowerCase().split(/[\s-]+/).forEach(word => {
                if (word.length > 2) dictionary.add(word);
            });
        });
    });

    // Get categories
    const categories = await Category.find({ storeId: storeObjectId })
        .select('title')
        .lean();

    categories.forEach(c => {
        c.title.toLowerCase().split(/[\s&,.-]+/).forEach(word => {
            if (word.length > 3) dictionary.add(word);
        });
    });

    // Get brands
    const brands = await Brand.find({ storeId: storeObjectId })
        .select('name')
        .lean();

    brands.forEach(b => {
        b.name.toLowerCase().split(/[\s&,.-]+/).forEach(word => {
            if (word.length > 2) dictionary.add(word);
        });
    });

    return dictionary;
}

/**
 * Suggest a corrected search query based on the store's dictionary
 */
export async function getSearchSuggestions(storeId: string, query: string): Promise<string | null> {
    const dictionary = await buildStoreDictionary(storeId);
    if (dictionary.size === 0) return null;

    const words = query.toLowerCase().split(/[\s&,.-]+/).filter(w => w.length > 2);
    let corrected = false;
    const suggestedWords = words.map(word => {
        // If word exists in dictionary, return as is
        if (dictionary.has(word)) return word;

        // Otherwise find the closest word in dictionary
        let bestMatch: string | null = null;
        let minDistance = 3; // Max threshold for typos (1-2 is usually best)

        for (const candidate of dictionary) {
            // Optimization: skip candidates with very different lengths
            if (Math.abs(candidate.length - word.length) > 2) continue;

            const distance = levenshteinDistance(word, candidate);
            if (distance < minDistance) {
                minDistance = distance;
                bestMatch = candidate;
            }
        }

        if (bestMatch && bestMatch !== word) {
            corrected = true;
            return bestMatch;
        }
        return word;
    });

    return corrected ? suggestedWords.join(' ') : null;
}
