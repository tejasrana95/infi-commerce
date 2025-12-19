// Image Module - Single image with optional link

import Image from 'next/image';
import Link from 'next/link';
import styles from './Image.module.scss';

interface ImageConfig {
    src: string;
    alt: string;
    link?: string;
    width?: 'full' | 'auto';
    objectFit?: 'cover' | 'contain' | 'fill';
    alignment?: 'left' | 'center' | 'right';
    borderRadius?: number;
    shadow?: 'none' | 'small' | 'medium' | 'large';
}

interface ImageProps {
    config: ImageConfig;
    styling?: any;
}

export default function ImageModule({ config, styling }: ImageProps) {
    const {
        src,
        alt,
        link,
        width = 'full',
        objectFit = 'cover',
        alignment = 'center',
        borderRadius = 0,
        shadow = 'none'
    } = config;

    if (!src) {
        return null;
    }

    const imageElement = (
        <div
            className={`${styles.imageWrapper} ${styles[width]} ${styles[alignment]} ${styles[`shadow-${shadow}`]}`}
            style={{ borderRadius: `${borderRadius}px`, ...styling }}
        >
            <Image
                src={src}
                alt={alt || ''}
                width={width === 'full' ? 1200 : 600}
                height={width === 'full' ? 600 : 400}
                className={styles.image}
                style={{ objectFit, borderRadius: `${borderRadius}px` }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
            />
        </div>
    );

    if (link) {
        return (
            <Link href={link} className={styles.link}>
                {imageElement}
            </Link>
        );
    }

    return imageElement;
}
