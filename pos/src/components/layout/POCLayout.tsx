'use client';

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History, Settings, LogOut, Maximize, Minimize, Loader2, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSessionStore } from '@/store/sessionStore';
import { useStore } from '@/contexts/StoreContext';
import { useUser } from '@/contexts/UserContext';
import Header from '@/components/organisms/Header';
import { OfflineIndicator } from '@/components/atoms/OfflineIndicator';
import { StartShiftModal } from '@/components/organisms/StartShiftModal';
import { EndShiftModal } from '@/components/organisms/EndShiftModal';
import api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { HoldOrderModal } from '@/components/organisms/HoldOrderModal';
import { HeldOrdersList } from '@/components/organisms/HeldOrdersList';
import { useCartStore } from '@/store/cartStore';

interface POCLayoutProps {
    children: React.ReactNode;
}

export default function POCLayout({ children }: POCLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { store, loading: storeLoading } = useStore();
    const { logout: authLogout, isAuthenticated, loading: authLoading } = useAuth();
    const { loading: userLoading } = useUser();
    const { activeSession, setActiveSession, startSession } = useSessionStore();
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showStartShiftModal, setShowStartShiftModal] = useState(false);
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [isShiftEnded, setIsShiftEnded] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [showHoldOrderModal, setShowHoldOrderModal] = useState(false);
    const [showHeldOrdersList, setShowHeldOrdersList] = useState(false);
    const { items } = useCartStore();



    // Check for active session on mount and coordinate auth/store state
    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
                const session = await api.getCurrentSession();
                if (!mounted) return;

                if (session && session.status === 'active') {
                    setActiveSession(session);
                    if (!useSessionStore.getState().sessionStartTime) {
                        startSession(store!.name);
                    }
                } else {
                    // Clear any stale session from persisted store
                    if (useSessionStore.getState().activeSession) {
                        useSessionStore.getState().endSession();
                    }
                    setShowStartShiftModal(true);
                }
            } catch (err) {
                console.error('Failed to check session:', err);
                if (useSessionStore.getState().activeSession) {
                    useSessionStore.getState().endSession();
                }
                setShowStartShiftModal(true);
            } finally {
                if (mounted) setCheckingSession(false);
            }
        };

        // If any provider is still loading, wait
        if (authLoading || storeLoading || userLoading) {
            setCheckingSession(true);
            return;
        }

        // If user is not authenticated, stop checking and redirect to login
        if (!isAuthenticated) {
            setCheckingSession(false);
            router.push('/login');
            return;
        }

        // If authenticated but no store selected, stop checking — login flow should have set store
        if (!store?._id) {
            setCheckingSession(false);
            return;
        }

        // Otherwise check session with backend
        checkSession();

        return () => {
            mounted = false;
        };
    }, [isAuthenticated, authLoading, storeLoading, userLoading, store?._id, router, setActiveSession, startSession]);

    // Check fullscreen state
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        // ... existing fullscreen logic ...
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err);
        }
    };

    const handleLogout = () => {
        authLogout();
    };

    const handleStartSessionSuccess = (session: any) => {
        setActiveSession(session);
        startSession(store?.name);
        setShowStartShiftModal(false);
    };

    const handleEndShiftSuccess = () => {
        setIsShiftEnded(true);
        // Clear the active session from Zustand store
        useSessionStore.getState().endSession();
        // Do NOT close modal yet - let user see summary
    };

    const handleEndShiftClose = () => {
        setShowEndShiftModal(false);
        if (isShiftEnded) {
            handleLogout();
        }
    };

    if (authLoading || storeLoading || userLoading || checkingSession) {
        const message = authLoading ? 'Checking authentication...' : storeLoading ? 'Loading store information...' : checkingSession ? 'Checking session status...' : 'Loading...';
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-medium">{message}</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full bg-gray-100 overflow-hidden font-sans">
            {/* Sidebar Navigation (Narrow) */}
            <aside className="w-16 bg-slate-900 text-white flex flex-col items-center py-4 z-20">
                <div className="mb-8 font-bold text-xl text-blue-400">
                    {store?.logo ? (
                        <Image src={store.logo} alt={store.name} width={10} height={10} className="w-10 h-10 rounded-lg object-contain bg-white" />
                    ) : (
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {store?.name?.charAt(0) || 'I'}
                        </div>
                    )}
                </div>

                <nav className="flex-1 flex flex-col gap-4 w-full px-2">
                    <NavItem href="/" icon={<LayoutDashboard size={24} />} label="POS" active={pathname === '/'} />
                    <NavItem href="/orders" icon={<History size={24} />} label="Orders" active={pathname === '/orders'} />
                    <button
                        onClick={() => setShowHeldOrdersList(true)}
                        className="p-3 rounded-xl transition-colors flex justify-center group relative text-slate-400 hover:bg-slate-800 hover:text-white"
                        title="Held Orders"
                    >
                        <Package size={24} />
                        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                            Held Orders
                        </span>
                    </button>
                    <NavItem href="/settings" icon={<Settings size={24} />} label="Settings" active={pathname === '/settings'} />
                </nav>

                <div className="mt-auto flex flex-col gap-4 w-full px-2">
                    <button
                        onClick={toggleFullscreen}
                        className="p-3 rounded-xl hover:bg-slate-800 transition-colors flex justify-center text-slate-400 hover:text-white"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
                    </button>
                    <button
                        onClick={() => setShowEndShiftModal(true)}
                        className="p-3 rounded-xl hover:bg-red-900/50 transition-colors flex justify-center text-red-400"
                        title="Logout"
                    >
                        <LogOut size={24} />
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Header />

                {/* Page Content */}
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </main>

            {/* End Shift Modal for Logout */}
            {activeSession && (
                <EndShiftModal
                    isOpen={showEndShiftModal}
                    onClose={handleEndShiftClose}
                    session={activeSession}
                    onSuccess={handleEndShiftSuccess}
                />
            )}

            {/* Start Shift Modal - Blocking */}
            <StartShiftModal
                isOpen={showStartShiftModal}
                onClose={() => { }} // Empty function ensures it cannot be closed without success or logout
                onSuccess={handleStartSessionSuccess}
            />

            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Hold Order Modal */}
            <HoldOrderModal
                isOpen={showHoldOrderModal}
                onClose={() => setShowHoldOrderModal(false)}
            />

            {/* Held Orders List */}
            <HeldOrdersList
                isOpen={showHeldOrdersList}
                onClose={() => setShowHeldOrdersList(false)}
            />
        </div>
    );
}

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Link
            href={href}
            className={cn(
                "p-3 rounded-xl transition-colors flex justify-center group relative",
                active ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
        >
            {icon}
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {label}
            </span>
        </Link>
    )
}
