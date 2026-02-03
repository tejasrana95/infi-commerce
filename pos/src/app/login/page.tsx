'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import { Store } from 'lucide-react';
import { Mail, Eye, EyeOff, ShieldCheck, Check } from 'lucide-react';

import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Dialog from '@/components/atoms/Dialog';
import { useSessionStore } from '@/store/sessionStore';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/apiClient';
import api from '@/services/api';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import packageJson from '../../../package.json';
import Link from 'next/link';

const LoginPage = memo(() => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const startSession = useSessionStore((state) => state.startSession);
    const router = useRouter();
    const { setStoreId } = useStore();
    const { login } = useAuth();

    const toggleShowPassword = useCallback(() => setShowPassword((s) => !s), []);
    const handleForgot = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setShowForgotModal(true);
    }, []);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Call backend admin authentication endpoint
            const response = await apiClient.post('/auth/admin/login', {
                email,
                password,
            });
            const { accessToken, user } = response.data;
            // Check if user has POS access
            if (user.role !== 'pos_user' && user.role !== 'store_admin' && user.role !== 'super_admin') {
                setError('Access denied. POS access requires POS User and Store Admin role.');
                setLoading(false);
                return;
            }

            const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User';
            let storeName = 'My Store';
            let storeId = '';

            // Set store ID if user has store
            if (user.storeIds && user.storeIds.length > 0) {
                storeId = user.storeIds[0];

                setStoreId(storeId);

                // Fetch store name
                try {
                    const storeData = await api.getStoreData(storeId);
                    if (storeData && storeData?.posSettings?.enabled === false) {
                        setError('The Point of Sale is disabled for this store. Please contact your system administrator.');
                        setLoading(false);
                        return;
                    }
                    storeName = storeData.name;
                } catch (storeErr) {
                    console.error('Failed to fetch store name:', storeErr);
                }
            } else {
                setError('No store assigned to this admin account.');
                setLoading(false);
                return;
            }

            // Start POC session state with real data
            startSession(storeName, userName);

            // Normalize user object to our User context shape
            const normalizedUser = {
                id: user.id || user._id,
                _id: user._id || user.id, // Ensure both exist
                email: user.email,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
                firstName: user.firstName || user.name?.split(' ')[0] || 'POC',
                lastName: user.lastName || user.name?.split(' ')[1] || 'User',
                role: user.role,
                storeIds: user.storeIds || [],
                permissions: user.permissions || [],
                posPermissions: user.posPermissions || { canApplyDiscount: false },
                twoFactorEnabled: !!user.twoFactorEnabled
            };

            // Store auth in AuthContext (this sets token, user, and store id)
            login(accessToken, normalizedUser, storeId);

            // Redirect to main page
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(
                err.response?.data?.message ||
                'Invalid email or password. Please try again.'
            );
            setLoading(false);
        }
    }, [email, password, startSession, router, setStoreId, login]);

    const versionDisplay = useMemo(() => `Version ${packageJson.version} © Infi Commerce By Infi Technology`, []);

    return (
        <div className="min-h-screen bg-gradient-to-r from-slate-50 via-white to-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Left Info Panel */}
                <div className="md:col-span-7 bg-gradient-to-b from-blue-700 to-indigo-700 rounded-3xl p-10 text-white flex flex-col justify-between shadow-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-white/10 rounded-lg p-3">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Point of Sale</h2>
                                <p className="text-sm text-white/80">Enterprise access portal</p>
                            </div>
                        </div>

                        <h3 className="text-3xl font-bold mb-4">Secure POS access for your stores</h3>
                        <p className="text-slate-100/85 mb-6 max-w-prose">
                            Centralized enterprise-level sign in for POC users and admins.
                        </p>

                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white/10 text-white"><Check size={14} /></span>
                                Touch based & keyboard friendly UI
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white/10 text-white"><Check size={14} /></span>
                                Easy shift & session management
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-white/10 text-white"><Check size={14} /></span>
                                Quick sale processing & payments
                            </li>
                        </ul>
                    </div>

                    <div className="text-xs text-white/70 mt-8">
                        <div>Need help? Contact your IT administrator.</div>
                        <div className="mt-2"><Link href="https://www.infitechnology.com" target='_blank' title='Infi Commerce By Infi Technology'>{versionDisplay}</Link></div>
                    </div>
                </div>

                {/* Right Auth Card */}
                <div className="md:col-span-5 bg-white rounded-3xl p-8 shadow-lg flex flex-col justify-center">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">Welcome back</h1>
                            <p className="text-sm text-slate-500">Sign in to access your POS</p>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email with icon */}
                        <div className="relative">
                            <span className="absolute left-3 top-9 text-slate-400"><Mail className="w-4 h-4" /></span>
                            <Input
                                label="Email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                                className="pl-10"
                            />
                        </div>

                        {/* Password with show/hide */}
                        <div className="relative">
                            <span className="absolute left-3 top-9 text-slate-400"><ShieldCheck className="w-4 h-4" /></span>
                            <Input
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                error={error}
                                className="pr-12 pl-10"
                            />
                            <button
                                type="button"
                                onClick={toggleShowPassword}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <button onClick={handleForgot} className="text-sm text-blue-600 hover:underline">Forgot password?</button>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className="w-full"
                            isLoading={loading}
                        >
                            Sign In
                        </Button>

                    </form>

                    {/* Info */}
                    <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-xs font-semibold text-slate-700 mb-1">Access Requirements</p>
                        <p className="text-xs text-slate-600">POC User, Store Admin, or Super Admin role required. Use your admin panel email and password.</p>
                    </div>
                </div>
            </div>
            {/* Forgot Password Modal */}
            <Dialog open={showForgotModal} onClose={() => setShowForgotModal(false)} title="Forgot Password">
                <p className="text-sm text-gray-600 mb-4">
                    Please contact your System Admin or IT Admin to reset your password.
                </p>
                <Button onClick={() => setShowForgotModal(false)} variant="primary" size="sm">
                    Close
                </Button>
            </Dialog>
        </div>
    );
});

LoginPage.displayName = 'LoginPage';

export default LoginPage;
