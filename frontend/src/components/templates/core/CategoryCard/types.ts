// CategoryCard Types - Shared between Core and Templates

export interface CategoryTemplateProps {
    // Category Info
    id: string;
    title: string;
    slug: string;
    description?: string;

    // Media
    imageUrl?: string;
    imageAlt: string;
    imagePriority?: boolean;

    // Stats
    productCount?: number;

    // URLs
    categoryUrl: string;

    // Display options
    style?: 'card' | 'banner' | 'minimal' | 'overlay';
    showDescription?: boolean;
}

// Raw category data from API
export interface Category {
    _id: string;
    title: string;
    slug: string;
    image?: string;
    description?: string;
    productCount?: number;
    showDescription?: boolean;
}
