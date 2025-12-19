'use client';

import React, { useMemo } from 'react';
import { ModuleProps } from '../..';
import styles from './Video.module.scss';

interface VideoConfig {
    source: 'youtube' | 'vimeo' | 'file';
    url: string;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    aspectRatio?: '16:9' | '4:3' | '21:9' | '1:1';
    poster?: string;
    borderRadius?: number;
    alignment?: 'left' | 'center' | 'right';
    maxWidth?: number | string;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
        /youtube\.com\/watch\?.*v=([^&\s]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
};

// Extract Vimeo video ID from URL
const getVimeoId = (url: string): string | null => {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return match ? match[1] : null;
};

// Map aspect ratio to CSS class
const aspectRatioClassMap: Record<string, string> = {
    '16:9': 'aspect16x9',
    '4:3': 'aspect4x3',
    '21:9': 'aspect21x9',
    '1:1': 'aspect1x1',
};

export default function VideoModule({ config }: ModuleProps) {
    const {
        source = 'youtube',
        url,
        autoplay = false,
        muted = true,
        loop = false,
        controls = true,
        aspectRatio = '16:9',
        poster,
        borderRadius = 12,
        alignment = 'center',
        maxWidth,
    } = config as VideoConfig;

    const embedUrl = useMemo(() => {
        if (source === 'youtube') {
            const videoId = getYouTubeId(url);
            if (!videoId) return null;

            const params = new URLSearchParams({
                autoplay: autoplay ? '1' : '0',
                mute: muted ? '1' : '0',
                loop: loop ? '1' : '0',
                controls: controls ? '1' : '0',
                rel: '0',
                modestbranding: '1',
            });

            if (loop) {
                params.append('playlist', videoId);
            }

            return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
        }

        if (source === 'vimeo') {
            const videoId = getVimeoId(url);
            if (!videoId) return null;

            const params = new URLSearchParams({
                autoplay: autoplay ? '1' : '0',
                muted: muted ? '1' : '0',
                loop: loop ? '1' : '0',
                controls: controls ? '1' : '0',
                dnt: '1',
            });

            return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
        }

        return url;
    }, [source, url, autoplay, muted, loop, controls]);

    if (!url) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.placeholder}>
                        <span>🎬</span>
                        <p>No video URL provided</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    if (!embedUrl && source !== 'file') {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className={styles.container}>
                    <div className={styles.placeholder}>
                        <span>⚠️</span>
                        <p>Invalid video URL</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const aspectClass = styles[aspectRatioClassMap[aspectRatio] || 'aspect16x9'];
    const alignClass = styles[`align${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`];

    const maxWidthStyle = maxWidth
        ? typeof maxWidth === 'number'
            ? `${maxWidth}px`
            : maxWidth
        : undefined;

    return (
        <div className={`${styles.container} ${alignClass}`}>
            <div
                className={`${styles.videoWrapper} ${aspectClass}`}
                style={{
                    borderRadius: `${borderRadius}px`,
                    maxWidth: maxWidthStyle,
                }}
            >
                {source === 'file' ? (
                    <video
                        className={styles.video}
                        src={url}
                        autoPlay={autoplay}
                        muted={muted}
                        loop={loop}
                        controls={controls}
                        playsInline
                        poster={poster}
                        style={{ borderRadius: `${borderRadius}px` }}
                    >
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    <iframe
                        className={styles.iframe}
                        src={embedUrl || undefined}
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        style={{ borderRadius: `${borderRadius}px` }}
                    />
                )}
            </div>
        </div>
    );
}
