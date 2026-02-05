'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Shield, Eye, EyeOff, Copy, Check } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import apiClient from '@/lib/apiClient';

type Tab = 'account' | 'security' | '2fa';

export default function ProfilePage() {
    const { user } = useUser();
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('account');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Account tab state
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        phone: '',
    });

    // Password tab state
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false,
    });
    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // 2FA tab state
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showSetupStep, setShowSetupStep] = useState<'initial' | 'qr' | 'codes'>('initial');
    const [copiedCode, setCopiedCode] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phone: user.phone || '',
            });
            setTwoFactorEnabled(user.twoFactorEnabled || false);
        }
    }, [user]);

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.put('/auth/admin/me', profileData);
            setSuccess('Profile updated successfully');
            // Refresh user data
            const response = await apiClient.get('/auth/admin/me');
            localStorage.setItem('pos_user', JSON.stringify(response.data.user));
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError('New password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/auth/admin/change-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });
            setSuccess('Password changed successfully');
            setPasswordData({
                oldPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    // 2FA Functions
    const handleInitiate2FA = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/auth/admin/2fa/setup');
            setSetupData(response.data);
            setShowSetupStep('qr');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await apiClient.post('/auth/admin/2fa/verify', { code: verificationCode });
            setBackupCodes(response.data.backupCodes);
            setTwoFactorEnabled(true);
            setShowSetupStep('codes');
            setVerificationCode('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            setError('Please enter a valid 6-digit code to disable 2FA');
            return;
        }

        setLoading(true);
        setError('');
        try {
            await apiClient.post('/auth/admin/2fa/disable', { code: verificationCode });
            setTwoFactorEnabled(false);
            setVerificationCode('');
            setSuccess('2FA disabled successfully. Logging out...');
            setTimeout(() => logout(), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const finishSetup = () => {
        setShowSetupStep('initial');
        setSetupData(null);
        setBackupCodes([]);
        setSuccess('2FA enabled successfully. Logging out to apply changes...');
        setTimeout(() => logout(), 2000);
    };

    const cancelSetup = () => {
        setShowSetupStep('initial');
        setSetupData(null);
        setVerificationCode('');
        setError('');
    };

    const tabs = [
        { id: 'account' as Tab, label: 'Account', icon: User },
        { id: 'security' as Tab, label: 'Password', icon: Lock },
        { id: '2fa' as Tab, label: 'Two-Factor Auth', icon: Shield },
    ];

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
                <p className="text-sm text-slate-600 mt-1">{user?.email}</p>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r p-4">
                    <nav className="space-y-1">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setError('');
                                        setSuccess('');
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                                        activeTab === tab.id
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

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        {/* Account Tab */}
                        {activeTab === 'account' && (
                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                <div className="bg-white rounded-lg border p-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Personal Information</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input
                                                label="First Name"
                                                name="firstName"
                                                value={profileData.firstName}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                            <Input
                                                label="Last Name"
                                                name="lastName"
                                                value={profileData.lastName}
                                                onChange={handleProfileChange}
                                                required
                                            />
                                        </div>

                                        <Input
                                            label="Email Address"
                                            value={user?.email || ''}
                                            disabled
                                        />
                                        <p className="text-xs text-slate-500 -mt-2">Email address cannot be changed</p>

                                        <Input
                                            label="Phone Number"
                                            name="phone"
                                            value={profileData.phone}
                                            onChange={handleProfileChange}
                                            placeholder="+1 234 567 8900"
                                        />
                                    </div>

                                    <div className="mt-6">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            isLoading={loading}
                                            className="px-6"
                                        >
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Password Tab */}
                        {activeTab === 'security' && (
                            <form onSubmit={handleChangePassword} className="space-y-6">
                                <div className="bg-white rounded-lg border p-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-4">Change Password</h2>
                                    
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <Input
                                                label="Current Password"
                                                name="oldPassword"
                                                type={showPasswords.old ? 'text' : 'password'}
                                                value={passwordData.oldPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                                                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPasswords.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                label="New Password"
                                                name="newPassword"
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        <div className="relative">
                                            <Input
                                                label="Confirm New Password"
                                                name="confirmPassword"
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>

                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <p className="text-xs text-blue-900">
                                                Password must be at least 8 characters long
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-6">
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            isLoading={loading}
                                            className="px-6"
                                        >
                                            Update Password
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* 2FA Tab */}
                        {activeTab === '2fa' && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg border p-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-2">Two-Factor Authentication</h2>
                                    <p className="text-sm text-slate-600 mb-6">
                                        Add an extra layer of security to your account by requiring a code from your authenticator app.
                                    </p>

                                    {/* Initial State */}
                                    {showSetupStep === 'initial' && (
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                                    twoFactorEnabled ? 'bg-green-100' : 'bg-slate-100'
                                                }`}>
                                                    <Shield className={`w-6 h-6 ${
                                                        twoFactorEnabled ? 'text-green-600' : 'text-slate-400'
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">
                                                        {twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        {twoFactorEnabled 
                                                            ? 'Your account is protected with two-factor authentication'
                                                            : 'Enable 2FA to secure your account'
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {!twoFactorEnabled ? (
                                                <Button
                                                    onClick={handleInitiate2FA}
                                                    variant="primary"
                                                    size="md"
                                                    isLoading={loading}
                                                    className="px-6"
                                                >
                                                    Enable 2FA
                                                </Button>
                                            ) : (
                                                <div className="space-y-4">
                                                    <p className="text-sm text-slate-700 mb-3">
                                                        Enter your authenticator code to disable 2FA:
                                                    </p>
                                                    <Input
                                                        label="Authenticator Code"
                                                        type="text"
                                                        placeholder="000000"
                                                        value={verificationCode}
                                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        maxLength={6}
                                                    />
                                                    <Button
                                                        onClick={handleDisable2FA}
                                                        variant="primary"
                                                        size="md"
                                                        isLoading={loading}
                                                        disabled={verificationCode.length !== 6}
                                                        className="px-6 bg-red-600 hover:bg-red-700"
                                                    >
                                                        Disable 2FA
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* QR Code Step */}
                                    {showSetupStep === 'qr' && setupData && (
                                        <div>
                                            <div className="space-y-4">
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-2">Step 1: Scan QR Code</h3>
                                                    <p className="text-sm text-slate-600 mb-4">
                                                        Use your authenticator app (Google Authenticator, Authy, etc.) to scan this code
                                                    </p>
                                                    <div className="bg-white p-4 rounded-lg border inline-block">
                                                        <img 
                                                            src={setupData.qrCode} 
                                                            alt="QR Code" 
                                                            className="w-48 h-48"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-slate-900 mb-2">Step 2: Enter Verification Code</h3>
                                                    <p className="text-sm text-slate-600 mb-3">
                                                        Enter the 6-digit code from your authenticator app
                                                    </p>
                                                    <Input
                                                        label="Verification Code"
                                                        type="text"
                                                        placeholder="000000"
                                                        value={verificationCode}
                                                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                                        maxLength={6}
                                                        autoFocus
                                                    />
                                                </div>

                                                <div className="flex gap-3 mt-6">
                                                    <Button
                                                        onClick={handleVerify2FA}
                                                        variant="primary"
                                                        size="md"
                                                        isLoading={loading}
                                                        disabled={verificationCode.length !== 6}
                                                        className="px-6"
                                                    >
                                                        Verify & Enable
                                                    </Button>
                                                    <Button
                                                        onClick={cancelSetup}
                                                        variant="secondary"
                                                        size="md"
                                                        className="px-6"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Backup Codes Step */}
                                    {showSetupStep === 'codes' && backupCodes.length > 0 && (
                                        <div>
                                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                                <div className="flex items-center gap-2 text-green-800 font-semibold mb-1">
                                                    <Check className="w-5 h-5" />
                                                    2FA Enabled Successfully!
                                                </div>
                                                <p className="text-sm text-green-700">
                                                    Save these backup codes in a secure place
                                                </p>
                                            </div>

                                            <h3 className="font-semibold text-slate-900 mb-2">Backup Codes</h3>
                                            <p className="text-sm text-slate-600 mb-4">
                                                Use these codes to access your account if you lose your authenticator device. Each code can only be used once.
                                            </p>

                                            <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {backupCodes.map((code, index) => (
                                                        <div key={index} className="font-mono text-sm bg-white px-3 py-2 rounded border">
                                                            {code}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Button
                                                    onClick={copyBackupCodes}
                                                    variant="secondary"
                                                    size="md"
                                                    className="px-6 flex items-center"
                                                >
                                                    {copiedCode ? (
                                                        <>
                                                            <Check className="w-4 h-4 mr-2" />
                                                            Copied!
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="w-4 h-4 mr-2" />
                                                            Copy Codes
                                                        </>
                                                    )}
                                                </Button>
                                                <Button
                                                    onClick={finishSetup}
                                                    variant="primary"
                                                    size="md"
                                                    className="px-6"
                                                >
                                                    Done
                                                </Button>
                                            </div>

                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                                                <p className="text-sm text-amber-900">
                                                    <strong>Note:</strong> You will be logged out automatically after clicking "Done" to finalize the setup.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
