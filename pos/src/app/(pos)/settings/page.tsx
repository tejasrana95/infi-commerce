'use client';

import React, { useState } from 'react';
import SettingsSection from '@/components/molecules/SettingsSection';
import { keyboardShortcuts } from '@/mock/settings';
import { useSettingsStore } from '@/store/settingsStore';
import { Keyboard, Save } from 'lucide-react';
import Button from '@/components/atoms/Button';

type Tab = 'shortcuts' | 'preferences';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('shortcuts');
    const settings = useSettingsStore();
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs = [
        { id: 'shortcuts' as Tab, label: 'Keyboard Shortcuts', icon: Keyboard },
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

                                {keyboardShortcuts.map((category, idx) => (
                                    <SettingsSection
                                        key={idx}
                                        title={category.category}
                                    >
                                        <div className="space-y-3">
                                            {category.shortcuts.map((shortcut, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className="flex items-center justify-between py-2"
                                                >
                                                    <span className="text-slate-700">{shortcut.description}</span>
                                                    <kbd className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-sm font-mono font-medium text-slate-800 shadow-sm">
                                                        {shortcut.keys}
                                                    </kbd>
                                                </div>
                                            ))}
                                        </div>
                                    </SettingsSection>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
