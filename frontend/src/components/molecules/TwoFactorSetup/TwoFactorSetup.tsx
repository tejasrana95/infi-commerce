'use client';

import React, { useState } from 'react';
import styles from './TwoFactorSetup.module.scss';
import { useCustomer } from '@/providers/AuthProvider';
import api from '@/lib/api';

export default function TwoFactorSetup() {
    const { customer, refreshCustomer, logout } = useCustomer();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showDisableDialog, setShowDisableDialog] = useState(false);

    const handleInitiate = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('auth/customer/2fa/setup');
            // The custom api client returns JSON directly, not an axios response object
            setSetupData(response);
            setShowSetupModal(true);
        } catch (err: any) {
            setError(err.message || 'Failed to initiate 2FA setup');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await api.post('auth/customer/2fa/verify', { code: verificationCode });
            setBackupCodes(response.backupCodes);
            setSetupData(null);
            await refreshCustomer();
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        setLoading(true);
        setError('');
        try {
            await api.post('auth/customer/2fa/disable', { code: verificationCode });
            setShowDisableDialog(false);
            setVerificationCode('');
            await refreshCustomer();
            logout();
        } catch (err: any) {
            setError(err.message || 'Failed to disable 2FA');
        } finally {
            setLoading(false);
        }
    };

    const copyBackupCodes = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
    };

    const closeModal = () => {
        if (backupCodes.length > 0) {
            logout();
        } else {
            setShowSetupModal(false);
            setSetupData(null);
            setVerificationCode('');
            setError('');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.statusIconContainer}>
                <div className={styles.info}>
                    <div className={`${styles.statusIcon} ${customer?.twoFactorEnabled ? styles.enabled : ''}`}>
                        {customer?.twoFactorEnabled ? '🔒' : '🔓'}
                    </div>
                    <div className={styles.text}>
                        <strong>Two-Factor Authentication (2FA)</strong>
                        <p>
                            {customer?.twoFactorEnabled
                                ? 'Your account is secured with 2FA.'
                                : 'Add an extra layer of security to your account.'}
                        </p>
                    </div>
                </div>
                {!customer?.twoFactorEnabled ? (
                    <button onClick={handleInitiate} className={styles.primaryBtn} disabled={loading}>
                        {loading ? 'Processing...' : 'Enable 2FA'}
                    </button>
                ) : (
                    <button onClick={() => setShowDisableDialog(true)} className={styles.dangerBtn}>
                        Disable 2FA
                    </button>
                )}
            </div>

            {error && !showSetupModal && <div className={styles.error}>{error}</div>}



            {/* Setup Modal */}
            {showSetupModal && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modal} ${backupCodes.length > 0 ? styles.successModal : ''}`}>
                        <button className={styles.closeBtn} onClick={closeModal}>×</button>

                        {backupCodes.length > 0 ? (
                            <div className={styles.successBox}>
                                <div className={styles.icon}>✓</div>
                                <h3>Enabled Successfully!</h3>
                                <p>Please save these backup codes in a secure place. You'll need them if you lose access to your device.</p>
                                <p className={styles.logoutNotice}><strong>Note:</strong> You will be logged out automatically after clicking "Finish" to finalize the setup.</p>
                                <div className={styles.backupCodesGrid}>
                                    {backupCodes.map((code, index) => (
                                        <code key={index}>{code}</code>
                                    ))}
                                </div>
                                <button onClick={copyBackupCodes} className={styles.copyBtn}>Copy All Codes</button>
                                <button onClick={closeModal} className={styles.doneBtn}>Finish</button>
                            </div>
                        ) : (
                            <div className={styles.setupFlow}>
                                <h3>Set Up 2FA</h3>
                                {error && <div className={styles.error}>{error}</div>}

                                <div className={styles.step}>
                                    <span className={styles.stepNum}>1</span>
                                    <p>Scan this QR code with your authenticator app.</p>
                                </div>

                                <div className={styles.qrContainer}>
                                    {setupData?.qrCode && (
                                        <img src={setupData.qrCode} alt="2FA QR Code" />
                                    )}
                                </div>

                                <div className={styles.step}>
                                    <span className={styles.stepNum}>2</span>
                                    <p>Enter the 6-digit code from your app.</p>
                                </div>

                                <input
                                    type="text"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000 000"
                                    className={styles.codeInput}
                                    autoFocus
                                />

                                <div className={styles.modalActions}>
                                    <button
                                        onClick={handleVerify}
                                        className={styles.primaryBtn}
                                        disabled={loading || verificationCode.length !== 6}
                                    >
                                        {loading ? 'Verifying...' : 'Verify & Enable'}
                                    </button>
                                    <button onClick={closeModal} className={styles.secondaryBtn}>Cancel</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Disable Modal */}
            {showDisableDialog && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <button className={styles.closeBtn} onClick={() => setShowDisableDialog(false)}>×</button>
                        <div className={styles.setupFlow}>
                            <h3>Disable 2FA</h3>
                            {error && <div className={styles.error}>{error}</div>}

                            <p style={{ textAlign: 'center', marginBottom: '16px' }}>
                                This will significantly reduce your account security.
                            </p>

                            <p className={styles.logoutNoticeWarning}>
                                <strong>Warning:</strong> You will be logged out automatically after disabling 2FA.
                            </p>

                            <div className={styles.step} style={{ justifyContent: 'center', marginBottom: '12px' }}>
                                <p>Enter your 6-digit code to confirm.</p>
                            </div>

                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000 000"
                                className={styles.codeInput}
                                autoFocus
                            />

                            <div className={styles.modalActions}>
                                <button
                                    onClick={handleDisable}
                                    className={styles.dangerBtn}
                                    disabled={loading || verificationCode.length !== 6}
                                >
                                    {loading ? 'Processing...' : 'Confirm Disable'}
                                </button>
                                <button onClick={() => setShowDisableDialog(false)} className={styles.secondaryBtn}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
