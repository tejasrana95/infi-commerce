'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/services/api-client';
import styles from './DownloadsPage.module.scss';
import Link from 'next/link';

interface DownloadFile {
    name: string;
    url: string;
    fileSize: number;
}

interface Download {
    orderId: string;
    orderNumber: string;
    itemIndex: number;
    productId: string;
    productName: string;
    image?: string;
    files: DownloadFile[];
    downloadLimit?: number;
    downloadCount: number;
    downloadExpiresAt?: string;
    isExpired: boolean;
    limitReached: boolean;
    canDownload: boolean;
    purchasedAt: string;
}

export default function DownloadsPage() {
    const { isAuthenticated } = useAuth();
    const { success, error: showError } = useToast();
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isAuthenticated) {
            fetchDownloads();
        }
    }, [isAuthenticated]);

    const fetchDownloads = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('downloads');
            setDownloads(response.downloads || []);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Failed to load downloads');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (download: Download, fileIndex: number) => {
        const fileKey = `${download.orderId}-${download.itemIndex}-${fileIndex}`;

        if (downloadingFiles.has(fileKey)) return;

        try {
            setDownloadingFiles(prev => new Set(prev).add(fileKey));

            // Generate secure download URL
            const response = await apiClient.post(
                `downloads/${download.orderId}/${download.itemIndex}/generate-url`,
                { fileIndex }
            );

            const { downloadUrl, fileName } = response;

            // Create a temporary link and trigger download
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.target = '_blank';
            link.download = fileName || download.files[fileIndex].name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            success('Download started');

            // Refresh downloads to update count
            setTimeout(() => fetchDownloads(), 1000);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Download failed');
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(fileKey);
                return newSet;
            });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading your downloads...</div>
            </div>
        );
    }

    if (downloads.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>📥</div>
                    <h2>No Downloads Available</h2>
                    <p>You haven't purchased any digital products yet.</p>
                    <Link href="/products" className={styles.browseBtn}>
                        Browse Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1>My Downloads</h1>
                <p>Access your purchased digital products</p>
            </div>

            <div className={styles.downloadsList}>
                {downloads.map((download, index) => (
                    <div key={`${download.orderId}-${download.itemIndex}`} className={styles.downloadCard}>
                        <div className={styles.productInfo}>
                            {download.image && (
                                <div className={styles.productImage}>
                                    <img src={download.image} alt={download.productName} />
                                </div>
                            )}
                            <div className={styles.productDetails}>
                                <h3>{download.productName}</h3>
                                <p className={styles.orderInfo}>
                                    Order #{download.orderNumber} • Purchased {formatDate(download.purchasedAt)}
                                </p>
                                {download.downloadLimit && (
                                    <p className={styles.downloadInfo}>
                                        Downloads: {download.downloadCount} / {download.downloadLimit}
                                    </p>
                                )}
                                {download.downloadExpiresAt && (
                                    <p className={styles.expiryInfo}>
                                        {download.isExpired ? (
                                            <span className={styles.expired}>Expired on {formatDate(download.downloadExpiresAt)}</span>
                                        ) : (
                                            <span>Expires on {formatDate(download.downloadExpiresAt)}</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={styles.filesSection}>
                            {download.files.map((file, fileIndex) => {
                                const fileKey = `${download.orderId}-${download.itemIndex}-${fileIndex}`;
                                const isDownloading = downloadingFiles.has(fileKey);

                                return (
                                    <div key={fileIndex} className={styles.fileItem}>
                                        <div className={styles.fileInfo}>
                                            <span className={styles.fileName}>{file.name}</span>
                                            <span className={styles.fileSize}>{formatFileSize(file.fileSize)}</span>
                                        </div>
                                        <button
                                            className={styles.downloadBtn}
                                            onClick={() => handleDownload(download, fileIndex)}
                                            disabled={!download.canDownload || isDownloading}
                                        >
                                            {isDownloading ? (
                                                'Downloading...'
                                            ) : !download.canDownload ? (
                                                download.isExpired ? 'Expired' : 'Limit Reached'
                                            ) : (
                                                '⬇ Download'
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {!download.canDownload && !download.isExpired && download.limitReached && (
                            <div className={styles.limitReachedMsg}>
                                <p>You've reached the download limit for this product. Please contact support if you need assistance.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
