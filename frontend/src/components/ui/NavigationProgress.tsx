'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import styles from './NavigationProgress.module.css';

export default function NavigationProgress() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let progressInterval: NodeJS.Timeout | undefined;

        const handleStart = () => {
            setIsNavigating(true);
            setProgress(0);

            // Gradually increase progress
            progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) return 90;
                    return prev + Math.random() * 10;
                });
            }, 300);
        };

        // Listen for link clicks
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            // Ignore clicks on buttons or elements inside buttons
            if (target.closest('button')) {
                return;
            }

            const link = target.closest('a');

            if (link && link.href && !link.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                try {
                    const url = new URL(link.href);
                    const currentUrl = new URL(window.location.href);

                    // Only show progress if navigating to a different page
                    if (url.pathname !== currentUrl.pathname || url.search !== currentUrl.search) {
                        handleStart();
                    }
                } catch (err) {
                    // Invalid URL, ignore
                }
            }
        };

        // Listen for browser back/forward
        const handlePopState = () => {
            handleStart();
        };

        document.addEventListener('click', handleClick, true);
        window.addEventListener('popstate', handlePopState);

        return () => {
            document.removeEventListener('click', handleClick, true);
            window.removeEventListener('popstate', handlePopState);
            if (progressInterval) clearInterval(progressInterval);
        };
    }, []);

    // Complete progress when route actually changes
    useEffect(() => {
        if (isNavigating) {
            setProgress(100);
            const timeout = setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
            }, 200);
            return () => clearTimeout(timeout);
        }
    }, [pathname, searchParams]);

    if (!isNavigating) return null;

    return (
        <div className={styles.progressBar}>
            <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
