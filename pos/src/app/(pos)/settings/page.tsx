'use client';

import React, { useState } from 'react';
import SettingsSection from '@/components/molecules/SettingsSection';
import { Keyboard, Save, Wifi } from 'lucide-react';
import Button from '@/components/atoms/Button';
import { SyncSettings } from '@/components/SyncSettings';

type Tab = 'shortcuts' | 'preferences' | 'sync';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('shortcuts');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'shortcuts' as Tab, label: 'Keyboard Shortcuts', icon: Keyboard },
        { id: 'sync' as Tab, label: 'Offline & Sync', icon: Wifi },
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
                {activeTab !== 'shortcuts' && (
                    <Button
                        onClick={handleSave}
                        size='sm'
                        className="px-5  bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {saved ? 'Saved!' : 'Save Changes'}
                    </Button>
                )}
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className="w-64 bg-white border-r p-4">
                    <nav className="space-y-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'text-slate-700 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-3xl">
                        {activeTab === 'shortcuts' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                                    <p className="text-sm text-blue-900">
                                        <span className="font-bold">Tip:</span> Use these keyboard shortcuts to speed up your workflow.
                                    </p>
                                </div>

                                <SettingsSection title="General">
                                    <div className="space-y-3">
                                        <ShortcutItem label="Focus Barcode Input" shortcut="F2" />
                                        <ShortcutItem label="Focus Search Bar" shortcut="F4" />
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Cart Actions">
                                    <div className="space-y-3">
                                        <ShortcutItem label="Quick Pay / Checkout" shortcut="Ctrl + Enter" />
                                        <ShortcutItem label="Hold Order" shortcut="F3" />
                                    </div>
                                </SettingsSection>

                                <SettingsSection title="Checkout Modal">
                                    <div className="space-y-3">
                                        <ShortcutItem label="Confirm Payment" shortcut="Ctrl + Enter" />
                                        <ShortcutItem label="Print Receipt" shortcut="Ctrl + P" />
                                        <ShortcutItem label="Close Modal" shortcut="Esc" />
                                    </div>
                                </SettingsSection>
                            </div>
                        )}
                        {activeTab === 'sync' && (
                            <SyncSettings />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShortcutItem({ label, shortcut }: { label: string, shortcut: string }) {
    return (
        <div className="flex items-center justify-between py-2 bg-white px-2 rounded-md hover:bg-slate-50 transition-colors">
            <span className="text-slate-700 font-medium">{label}</span>
            <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm font-mono font-medium text-slate-600 shadow-sm min-w-[3rem] text-center">
                {shortcut}
            </kbd>
        </div>
    );
}
