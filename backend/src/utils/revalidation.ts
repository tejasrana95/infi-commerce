import Store from '../models/Store';

/**
 * Triggers frontend cache revalidation for multi-store setup
 * Finds the store's domain and calls the appropriate frontend URL
 */
export async function triggerRevalidation(
    storeId: string,
    type: 'product' | 'category' | 'page' | 'blog' | 'homepage' | 'layout',
    slug?: string,
    path?: string
) {
    try {
        // Skip if revalidation secret not set
        const revalidationSecret = process.env.REVALIDATION_SECRET;
        if (!revalidationSecret) {
            console.warn('REVALIDATION_SECRET not set, skipping cache revalidation');
            return;
        }

        // Fetch store to get domain
        const store = await Store.findById(storeId).select('domains').lean();
        if (!store || !store.domains || store.domains.length === 0) {
            console.warn(`Store ${storeId} not found or has no domains`);
            return;
        }

        // Use first domain from domains array
        const domain = store.domains[0];

        // Construct frontend URL from store domain
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const frontendUrl = `${protocol}://${domain}`;

        // Call revalidation API
        const response = await fetch(
            `${frontendUrl}/api/revalidate?secret=${revalidationSecret}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, slug, path }),
            }
        );

        if (response.ok) {
            await response.json();
        } else {
            console.error(`Failed to revalidate cache: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        console.error('Error triggering revalidation:', error);
        // Don't throw - cache revalidation failure shouldn't break the main operation
    }
}
