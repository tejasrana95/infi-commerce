'use client';

import React from 'react';
import Link from 'next/link';

export default function WishlistPage() {
    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '20px' }}>My Wishlist</h1>
            <div style={{ textAlign: 'center', padding: '60px 0', border: '1px solid #eee', borderRadius: '12px' }}>
                <p style={{ color: '#666', marginBottom: '20px' }}>Your wishlist is currently empty.</p>
                <Link href="/products" style={{
                    display: 'inline-block',
                    padding: '10px 20px',
                    background: '#000',
                    color: '#fff',
                    borderRadius: '8px',
                    textDecoration: 'none'
                }}>
                    Browse Products
                </Link>
            </div>
        </div>
    );
}
