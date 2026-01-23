import React from 'react';

interface SettingsSectionProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                {description && (
                    <p className="text-sm text-slate-600 mt-1">{description}</p>
                )}
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
