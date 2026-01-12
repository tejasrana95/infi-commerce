'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/providers/StoreProvider';
import { useCustomer } from '@/providers/AuthProvider';
import { getComponent } from '@/components/templates/registry';
import LoginForm from '@/components/molecules/AuthForms/LoginForm';
import RegisterForm from '@/components/molecules/AuthForms/RegisterForm';
import ForgotPasswordForm from '@/components/molecules/AuthForms/ForgotPasswordForm';
import ResetPasswordForm from '@/components/molecules/AuthForms/ResetPasswordForm';
import VerifyEmailForm from '@/components/molecules/AuthForms/VerifyEmailForm';

export type AuthPageType = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email';

interface AuthPageContainerProps {
    type: AuthPageType;
}

export default function AuthPageContainer({ type }: AuthPageContainerProps) {
    const router = useRouter();
    const { store } = useStore();
    const { isAuthenticated, isLoading } = useCustomer();
    const templateId = store?.theme?.templateId || 'modern-clean';

    // Track if this is the initial auth check (only show loader on first render)
    const [isInitialCheck, setIsInitialCheck] = useState(true);

    // Once initial loading is done, never show loader again (let form handle its own loading)
    useEffect(() => {
        if (!isLoading && isInitialCheck) {
            setIsInitialCheck(false);
        }
    }, [isLoading, isInitialCheck]);

    // Redirect authenticated users to account page
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push('/account');
        }
    }, [isAuthenticated, isLoading, router]);

    // Get the template component
    const AuthPageTemplate = getComponent('AuthPageTemplate', templateId);

    // Determine content based on type first (needed for loading state too)
    let title = '';
    let subtitle = '';
    let ContentComponent: React.ElementType | null = null;

    switch (type) {
        case 'login':
            title = 'Welcome back';
            subtitle = 'Sign in to your account to continue';
            ContentComponent = LoginForm;
            break;
        case 'register':
            title = 'Create an account';
            subtitle = 'Join us and start shopping today';
            ContentComponent = RegisterForm;
            break;
        case 'forgot-password':
            title = 'Forgot password?';
            subtitle = 'No worries, we will send you reset instructions.';
            ContentComponent = ForgotPasswordForm;
            break;
        case 'reset-password':
            title = 'Reset password';
            subtitle = 'Create a new password for your account';
            ContentComponent = ResetPasswordForm;
            break;
        case 'verify-email':
            title = 'Verify Email';
            subtitle = '';
            ContentComponent = VerifyEmailForm;
            break;
    }

    if (!AuthPageTemplate) {
        return <div>Template not found: AuthPageTemplate</div>;
    }

    // Show auth template with loader ONLY during initial auth check (not during login attempts)
    if ((isLoading && isInitialCheck) || isAuthenticated) {
        return (
            <AuthPageTemplate title={title} subtitle={subtitle}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3rem 2rem',
                    minHeight: '300px',
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid #e5e7eb',
                        borderTopColor: '#111827',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <style jsx>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                    <p style={{
                        marginTop: '1rem',
                        color: '#6b7280',
                        fontSize: '0.95rem',
                    }}>
                        {isAuthenticated ? 'Redirecting to your account...' : 'Loading...'}
                    </p>
                </div>
            </AuthPageTemplate>
        );
    }

    // Check if the current auth type is disabled
    const isLoginDisabled = store?.settings?.allowCustomerLogin === false;
    const isSignupDisabled = store?.settings?.allowCustomerSignup === false;

    if (type === 'login' && isLoginDisabled) {
        title = 'Login Disabled';
        subtitle = 'Customer login is currently disabled for this store.';
        ContentComponent = () => (
            <div className="text-center py-8">
                <p className="text-gray-600 mb-6">We apologize for the inconvenience. Please contact support if you need assistance.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    } else if (type === 'register' && isSignupDisabled) {
        title = 'Signup Disabled';
        subtitle = 'New customer registration is currently disabled for this store.';
        ContentComponent = () => (
            <div className="text-center py-8">
                <p className="text-gray-600 mb-6">You can still browse our products. If you already have an account, you can try logging in.</p>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => router.push('/login')}
                        className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Go to Login
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-2 border border-black rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </div>
        );
    } else if ((type === 'forgot-password' || type === 'reset-password') && isLoginDisabled) {
        title = 'Password Reset Disabled';
        subtitle = 'Password reset functionality is currently disabled for this store.';
        ContentComponent = () => (
            <div className="text-center py-8">
                <p className="text-gray-600 mb-6">Since login is disabled, password reset is also unavailable.</p>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <AuthPageTemplate title={title} subtitle={subtitle}>
            {ContentComponent && <ContentComponent />}
        </AuthPageTemplate>
    );
}

