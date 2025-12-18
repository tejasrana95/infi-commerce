const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function fetchStoreConfig(identifier: string) {
    // Try to fetch by ID first, then slug/domain logic could be added
    try {
        const res = await fetch(`${API_URL}/stores/${identifier}`, {
            next: { revalidate: 60 } // Revalidate every minute
        });

        if (!res.ok) {
            throw new Error('Failed to fetch store configuration');
        }

        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching store config:', error);
        return null;
    }
}

export async function fetchStoreByDomain(domain: string) {
    try {
        const res = await fetch(`${API_URL}/stores/domain/${domain}`, {
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            throw new Error('Failed to fetch store by domain');
        }

        return await res.json();
    } catch (error) {
        console.error('Error fetching store by domain:', error);
        return null;
    }
}
