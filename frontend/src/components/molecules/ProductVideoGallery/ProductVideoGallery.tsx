'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import styles from './ProductVideoGallery.module.scss';

interface ProductVideo {
    type: 'youtube' | 'vimeo' | 'url';
    url: string;
    thumbnail?: string;
    title?: string;
}

interface ProductVideoGalleryProps {
    videos: ProductVideo[];
    productName: string;
}

// Helper to extract YouTube video ID
function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// Helper to extract Vimeo video ID
function getVimeoId(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
}

export default function ProductVideoGallery({
    videos,
    productName,
}: ProductVideoGalleryProps) {
    const [activeVideo, setActiveVideo] = useState<number | null>(null);

    // Get embed URL for a video
    const getEmbedUrl = (video: ProductVideo): string | null => {
        if (video.type === 'youtube') {
            const id = getYouTubeId(video.url);
            return id ? `https://www.youtube.com/embed/${id}?autoplay=1` : null;
        }
        if (video.type === 'vimeo') {
            const id = getVimeoId(video.url);
            return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null;
        }
        return video.url; // Hosted video
    };

    // Get thumbnail URL
    const getThumbnail = (video: ProductVideo): string => {
        if (video.thumbnail) return video.thumbnail;

        if (video.type === 'youtube') {
            const id = getYouTubeId(video.url);
            return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
        }

        return '';
    };

    if (!videos || videos.length === 0) return null;

    return (
        <div className={styles.videoGallery}>
            <h3 className={styles.title}>Product Videos</h3>
            <div className={styles.videoGrid}>
                {videos.map((video, index) => {
                    const thumbnail = getThumbnail(video);
                    return (
                        <div key={index} className={styles.videoItem}>
                            {activeVideo === index ? (
                                <div className={styles.videoPlayer}>
                                    {video.type === 'url' ? (
                                        <video
                                            src={video.url}
                                            controls
                                            autoPlay
                                            className={styles.video}
                                        />
                                    ) : (
                                        <iframe
                                            src={getEmbedUrl(video) || undefined}
                                            title={video.title || `${productName} video ${index + 1}`}
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className={styles.iframe}
                                        />
                                    )}
                                    <button
                                        className={styles.closeBtn}
                                        onClick={() => setActiveVideo(null)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className={styles.thumbnailBtn}
                                    onClick={() => setActiveVideo(index)}
                                >
                                    {thumbnail ? (
                                        <Image
                                            src={thumbnail}
                                            alt={video.title || `${productName} video ${index + 1}`}
                                            fill
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div className={styles.placeholder}>
                                            <span>▶</span>
                                        </div>
                                    )}
                                    <div className={styles.playOverlay}>
                                        <span className={styles.playIcon}>▶</span>
                                    </div>
                                    {video.title && (
                                        <span className={styles.videoTitle}>{video.title}</span>
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
