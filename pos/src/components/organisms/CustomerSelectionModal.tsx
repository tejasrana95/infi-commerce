import React, { useState, useEffect, useCallback } from 'react';
import { User, Search, Plus, X, Check, Loader2, AlertCircle } from 'lucide-react';
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

interface FormErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
}

// Validation helpers
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
    // Allow empty or valid phone (10+ digits, can have spaces, dashes, parentheses)
    if (!phone) return true;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
};

export default function CustomerSelectionModal({ isOpen, onClose, onSelect }: CustomerSelectionModalProps) {
    const { formatPrice } = useCurrency();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'search' | 'create'>('search');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);

    // New Customer Form State
    const [newCustomer, setNewCustomer] = useState({
        firstName: '',
        lastName: '',
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

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        // First name validation
        if (!newCustomer.firstName.trim()) {
            newErrors.firstName = 'First name is required';
        } else if (newCustomer.firstName.trim().length < 2) {
            newErrors.firstName = 'First name must be at least 2 characters';
        }

        // Last name validation
        if (!newCustomer.lastName.trim()) {
            newErrors.lastName = 'Last name is required';
        } else if (newCustomer.lastName.trim().length < 2) {
            newErrors.lastName = 'Last name must be at least 2 characters';
        }

        // Email validation (required)
        if (!newCustomer.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(newCustomer.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Phone validation (optional but must be valid if provided)
        if (newCustomer.phone && !validatePhone(newCustomer.phone)) {
            newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setApiError(null);

        if (!validateForm()) {
            return;
        }

        setCreating(true);
        try {
            const created = await api.createCustomer({
                firstName: newCustomer.firstName.trim(),
                lastName: newCustomer.lastName.trim(),
                email: newCustomer.email.trim().toLowerCase(),
                phone: newCustomer.phone.trim() || undefined,
            });
            onSelect(created);
            onClose();
        } catch (error: any) {
            console.error('Failed to create customer:', error);
            setApiError(error.response?.data?.message || error.message || 'Failed to create customer');
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
            setNewCustomer({ firstName: '', lastName: '', phone: '', email: '' });
            setErrors({});
            setApiError(null);
        }
    }, [isOpen]);

    // Clear field error when user types
    const handleFieldChange = (field: keyof typeof newCustomer, value: string) => {
        setNewCustomer({ ...newCustomer, [field]: value });
        if (errors[field as keyof FormErrors]) {
            setErrors({ ...errors, [field]: undefined });
        }
    };

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
                                        </button>
                                    ))}

                                    {!loading && customers.length === 0 && search && (
                                        <div className="text-center py-8 text-slate-500">
                                            No customers found matching &quot;{search}&quot;
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                {/* API Error Alert */}
                                {apiError && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-red-700">{apiError}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900",
                                                errors.firstName && "border-red-400 focus:ring-red-500"
                                            )}
                                            value={newCustomer.firstName}
                                            onChange={e => handleFieldChange('firstName', e.target.value)}
                                            disabled={creating}
                                            placeholder="John"
                                        />
                                        {errors.firstName && (
                                            <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-800 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900",
                                                errors.lastName && "border-red-400 focus:ring-red-500"
                                            )}
                                            value={newCustomer.lastName}
                                            onChange={e => handleFieldChange('lastName', e.target.value)}
                                            disabled={creating}
                                            placeholder="Doe"
                                        />
                                        {errors.lastName && (
                                            <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Email Address *</label>
                                    <input
                                        type="email"
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900",
                                            errors.email && "border-red-400 focus:ring-red-500"
                                        )}
                                        value={newCustomer.email}
                                        onChange={e => handleFieldChange('email', e.target.value)}
                                        disabled={creating}
                                        placeholder="john.doe@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-800 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        className={cn(
                                            "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900",
                                            errors.phone && "border-red-400 focus:ring-red-500"
                                        )}
                                        value={newCustomer.phone}
                                        onChange={e => handleFieldChange('phone', e.target.value)}
                                        disabled={creating}
                                        placeholder="+91 9876543210"
                                    />
                                    {errors.phone && (
                                        <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                                    )}
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
