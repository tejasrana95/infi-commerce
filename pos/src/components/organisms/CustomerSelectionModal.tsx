import React, { useState, useEffect, useCallback } from 'react';
import { User, Search, Plus, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import api from '@/services/api';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer | null) => void;
}

export default function CustomerSelectionModal({ isOpen, onClose, onSelect }: CustomerSelectionModalProps) {
    const { formatPrice } = useCurrency();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState({
        name: '',
        phone: '',
        email: ''
    });

    const fetchCustomers = useCallback(async (query?: string) => {
        setLoading(true);
        try {
            const data = await api.getCustomers(query);
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            fetchCustomers(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search, fetchCustomers, isOpen]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const created = await api.createCustomer(newCustomer);
            onSelect(created);
            onClose();
        } catch (error) {
            console.error('Failed to create customer:', error);
        } finally {
            setCreating(false);
        }
    };

    // Close on Escape
    useKeyboardShortcuts([
        {
            key: 'Escape',
            action: onClose
        }
    ]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setSearch('');
            setActiveTab('search');
            setNewCustomer({ name: '', phone: '', email: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900">
                            <User className="w-5 h-5 text-slate-600" />
                            Select Customer
                        </h3>
                        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                            <X className="w-5 h-5 text-slate-500 hover:text-slate-800" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b">
                        <button
                            className={cn(
                                "flex-1 py-3 text-sm font-bold transition-colors",
                                activeTab === 'search' ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => setActiveTab('search')}
                        >
                            Search Existing
                        </button>
                        <button
                            className={cn(
                                "flex-1 py-3 text-sm font-bold transition-colors",
                                activeTab === 'create' ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => setActiveTab('create')}
                        >
                            Create New
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {activeTab === 'search' ? (
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                                    <input
                                        type="text"
                                        className="w-full pl-9 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-500"
                                        placeholder="Search by name, phone, email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        autoFocus
                                    />
                                    {loading && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => { onSelect(null); onClose(); }}
                                        className="w-full text-left p-3 rounded-lg border border-dashed border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">Walk-in Customer</div>
                                            <div className="text-xs text-slate-600">Default generic customer</div>
                                        </div>
                                    </button>

                                    {customers.map(customer => (
                                        <button
                                            key={customer.id}
                                            onClick={() => { onSelect(customer); onClose(); }}
                                            className="w-full text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center gap-3 group"
                                        >
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-200">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-slate-900">{customer.name}</div>
                                                <div className="text-xs text-slate-600 flex gap-2">
                                                    {customer.phone && <span>{customer.phone}</span>}
                                                    {customer.email && <span>• {customer.email}</span>}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs font-bold text-slate-700">{customer.totalOrders} Orders</div>
                                                <div className="text-xs text-slate-600">{formatPrice(customer.totalSpent)}</div>
                                            </div>
                                        </button>
                                    ))}

                                    {!loading && customers.length === 0 && search && (
                                        <div className="text-center py-8 text-slate-500">
                                            No customers found matching "{search}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Full Name *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={newCustomer.name}
                                        onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                                        disabled={creating}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={newCustomer.phone}
                                        onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                                        disabled={creating}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={newCustomer.email}
                                        onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })}
                                        disabled={creating}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md active:translate-y-0.5 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {creating ? 'Creating...' : 'Create & Select Customer'}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
