'use client';

import SectionRenderer from '@/components/core/layout/SectionRenderer';
import { Section } from '@/types/layout';
import { useStore } from '@/providers/StoreProvider';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import styles from './CheckoutPage.module.scss';

interface CheckoutTemplateProps {
    layout: Section[];
}

export default function CheckoutTemplate({
    layout
}: CheckoutTemplateProps) {
    const { store } = useStore();
    const { isAuthenticated, isLoading } = useAuth();

    // If no layout is provided, show fallback
    if (!layout || layout.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p>No checkout layout configured.</p>
            </div>
        );
    }

    // Check if guest checkout is allowed
    const allowGuestCheckout = (store as any)?.allowGuestCheckout !== false;

    if (!isLoading && !isAuthenticated && !allowGuestCheckout) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-11a4 4 0 11-8 0 4 4 0 018 0zM7 10h10a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in Required</h2>
                    <p className="text-gray-600 mb-8">
                        Guest checkout is disabled for this store. Please sign in to your account or create a new one to proceed with your order.
                    </p>
                    <div className="space-y-3">
                        <Link
                            href="/login?redirect=/checkout"
                            className="block w-full py-3 px-4 bg-black text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            Log In to Checkout
                        </Link>
                        <Link
                            href="/register?redirect=/checkout"
                            className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Create an Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.checkoutPage}>
            {layout.map((section) => (
                <SectionRenderer
                    key={section.id}
                    section={section}
                />
            ))}
        </div>
    );
}
