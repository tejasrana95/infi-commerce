// Core CategoryCard Template - Fallback presentation
// Basic card design for categories

import Link from 'next/link';
import { CategoryTemplateProps } from './types';

export default function CoreCategoryCardTemplate({
    title,
    imageUrl,
    imageAlt,
    categoryUrl,
    productCount,
}: CategoryTemplateProps) {
    return (
        <Link href={categoryUrl} style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{
                    position: 'relative',
                    paddingBottom: '75%',
                    background: '#f3f4f6'
                }}>
                    {imageUrl && (
                        <img
                            src={imageUrl}
                            alt={imageAlt}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    )}
                </div>
                <div style={{ padding: '16px' }}>
                    <h3 style={{
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#111827'
                    }}>
                        {title}
                    </h3>
                    {productCount !== undefined && (
                        <p style={{
                            margin: '4px 0 0',
                            fontSize: '14px',
                            color: '#6b7280'
                        }}>
                            {productCount} Products
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}
