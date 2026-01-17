'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.scss';
import api from '@/lib/api';
import Loader from '@/components/molecules/Loader';
import { useAuth } from '@/providers/AuthProvider';
import { useCart } from '@/providers/CartProvider';
import { useToast } from '@/providers/ToastProvider';
import { useStore } from '@/providers/StoreProvider';
import { useWishlist } from '@/providers/WishlistProvider';

interface WishlistProduct {
    _id: string;
    name: string;
    slug: string;
    price: number;
    salePrice?: number;
    images: string[];
    stockStatus: string;
}

export default function WishlistPage() {
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const { store } = useStore();
    const { removeFromWishlist } = useWishlist();
    const { success, error } = useToast();
    const [wishlist, setWishlist] = useState<WishlistProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchWishlist = async () => {
            try {
                const response = await api.get('wishlist');
                setWishlist(response.wishlist || []);
            } catch (error) {
                console.error('Failed to fetch wishlist:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [isAuthenticated]);

    const handleRemove = async (productId: string) => {
        setRemoving(productId);
        try {
            // Use WishlistProvider's removeFromWishlist to update context
            const result = await removeFromWishlist(productId);
            if (result) {
                // Update local state
                setWishlist(prev => prev.filter(item => item._id !== productId));
                success('Item removed from wishlist');
            } else {
                error('Failed to remove item');
            }
        } catch (err) {
            console.error('Failed to remove from wishlist:', err);
            error('Failed to remove item');
        } finally {
            setRemoving(null);
        }
    };

    const handleAddToCart = async (product: WishlistProduct) => {
        if (product.stockStatus === 'out_of_stock') return;
        if (!store?._id) {
            error('Store unavailable');
            return;
        }

        setAddingToCart(product._id);
        try {
            const result = await addToCart({
                productId: product._id,
                quantity: 1,
                storeId: store._id
            });
            if (result.success) {
                success('Added to cart');
            } else {
                error(result.error || 'Failed to add to cart');
            }
        } catch (err) {
            console.error('Failed to add to cart:', err);
            error('Failed to add to cart');
        } finally {
            setAddingToCart(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Loader variant="spinner" size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className={styles.container}>
                <div className={styles.authRequired}>
                    <div className={styles.authIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h2>Sign in to view your wishlist</h2>
                    <p>Save your favorite items and access them anytime</p>
                    <Link href="/login" className={styles.loginBtn}>
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>My Wishlist</h1>
                <p>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''}</p>
            </header>

            {wishlist.length > 0 ? (
                <div className={styles.productGrid}>
                    {wishlist.map((product) => (
                        <div key={product._id} className={styles.productCard}>
                            <button
                                className={styles.removeBtn}
                                onClick={() => handleRemove(product._id)}
                                disabled={removing === product._id}
                                aria-label="Remove from wishlist"
                            >
                                {removing === product._id ? (
                                    <span className={styles.spinner}></span>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>

                            <Link href={`/${product.slug}`} className={styles.productLink}>
                                <div className={styles.imageWrapper}>
                                    {product.images?.[0] ? (
                                        <Image
                                            src={product.images[0]}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 768px) 50vw, 25vw"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                        </div>
                                    )}
                                    {product.salePrice && product.salePrice < product.price && (
                                        <span className={styles.saleBadge}>Sale</span>
                                    )}
                                </div>

                                <div className={styles.productInfo}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <div className={styles.priceWrapper}>
                                        {product.salePrice && product.salePrice < product.price ? (
                                            <>
                                                <span className={styles.salePrice}>${product.salePrice.toFixed(2)}</span>
                                                <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <span className={styles.price}>${product.price.toFixed(2)}</span>
                                        )}
                                    </div>
                                    <span className={`${styles.stockStatus} ${styles[product.stockStatus]}`}>
                                        {product.stockStatus === 'in_stock' ? 'In Stock' :
                                            product.stockStatus === 'out_of_stock' ? 'Out of Stock' :
                                                product.stockStatus}
                                    </span>
                                </div>
                            </Link>

                            <button
                                className={styles.addToCartBtn}
                                onClick={() => handleAddToCart(product)}
                                disabled={addingToCart === product._id || product.stockStatus === 'out_of_stock'}
                            >
                                {addingToCart === product._id ? 'Adding...' :
                                    product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h3>Your wishlist is empty</h3>
                    <p>Save items you love by clicking the heart icon on products</p>
                    <Link href="/products" className={styles.shopBtn}>
                        Browse Products
                    </Link>
                </div>
            )}
        </div>
    );
}
