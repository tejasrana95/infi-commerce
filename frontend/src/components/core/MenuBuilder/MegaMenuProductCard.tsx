// Mini Product Card Component for Mega Menu
'use client';

import React from 'react';
import Link from 'next/link';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import styles from './MegaMenuProductCard.module.scss';
import Image from 'next/image';
import { useCurrency } from '@/providers/CurrencyProvider';
import { usePriceVisibility } from '@/hooks/usePriceVisibility';

interface Product {
    _id: string;
    name: string;
    slug?: string;
    price?: number;
    salePrice?: number;
    featuredImage?: string;
    images?: string[];
    rating?: number;
    reviewCount?: number;
}

interface MegaMenuProductCardProps {
    product: Product;
    showImage?: boolean;
    showPrice?: boolean;
    showRating?: boolean;
    imageSize?: 'small' | 'medium' | 'large';
    displayMode?: 'list' | 'grid' | 'compact';
    imagePosition?: 'left' | 'top';
}

const IMAGE_SIZE_MAP: Record<string, number> = {
    small: 60,
    medium: 100,
    large: 150,
};

function renderStars(rating: number) {
    const stars: React.ReactNode[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
        stars.push(<FaStar key={`full-${i}`} />);
    }
    if (hasHalfStar) {
        stars.push(<FaStarHalfAlt key="half" />);
    }
    const remaining = 5 - stars.length;
    for (let i = 0; i < remaining; i++) {
        stars.push(<FaRegStar key={`empty-${i}`} />);
    }
    return stars;
}

export default function MegaMenuProductCard({
    product,
    showImage = true,
    showPrice = true,
    showRating = false,
    imageSize = 'small',
    displayMode = 'list',
    imagePosition = 'left',
}: MegaMenuProductCardProps) {
    const productUrl = `/${product.slug || product._id}`;
    const { formatPriceWithExchange } = useCurrency();
    const { shouldShowPrice } = usePriceVisibility();
    // Images from API are string[] (plain URLs), not objects
    const imageUrl = product.featuredImage || product.images?.[0] || '';

    const currentPrice = product.salePrice || product.price;
    const hasDiscount =
        product.salePrice != null &&
        product.price != null &&
        product.salePrice < product.price;
    const size = IMAGE_SIZE_MAP[imageSize] || 60;

    // imagePosition overrides layout: 'top' forces column, 'left' forces row
    const layoutClass = imagePosition === 'top' ? styles.imgTop : styles.imgLeft;

    const cardClasses = [
        styles.productCard,
        styles[displayMode],
        styles[imageSize],
        layoutClass,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <Link href={productUrl} className={cardClasses}>
            {showImage && imageUrl && (
                <div
                    className={styles.imageWrapper}
                    style={{ width: size, height: size }}
                >
                    <Image src={imageUrl} alt={product.name} width={size} height={size} loading="lazy" />
                </div>
            )}

            <div className={styles.details}>
                <h4 className={styles.productName}>{product.name}</h4>

                {showPrice && shouldShowPrice && currentPrice != null && (
                    <div className={styles.priceWrapper}>
                        <span className={styles.price}>
                            {formatPriceWithExchange(currentPrice)}
                        </span>
                        {hasDiscount && (
                            <span className={styles.originalPrice}>
                                {formatPriceWithExchange(product.price!)}
                            </span>
                        )}
                    </div>
                )}

                {showRating && product.rating != null && (
                    <div className={styles.rating}>
                        <div className={styles.stars}>
                            {renderStars(product.rating)}
                        </div>
                        {product.reviewCount != null && product.reviewCount > 0 && (
                            <span className={styles.reviewCount}>
                                ({product.reviewCount})
                            </span>
                        )}
                    </div>
                )}
            </div>
        </Link>
    );
}
