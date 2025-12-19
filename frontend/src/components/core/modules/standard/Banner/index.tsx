// Banner Module - Hero image with text overlay

import Image from 'next/image';
import Link from 'next/link';
import styles from './Banner.module.scss';

interface BannerConfig {
    bannerId?: string;
    title?: string;
    subtitle?: string;
    image?: string;
    buttonText?: string;
    buttonLink?: string;
    textAlign?: 'left' | 'center' | 'right';
    height?: number;
    overlay?: boolean;
    overlayOpacity?: number;
}

interface BannerProps {
    config: BannerConfig;
    styling?: any;
    sectionSettings?: any;
}

export default function Banner({ config, styling }: BannerProps) {
    const {
        title,
        subtitle,
        image,
        buttonText,
        buttonLink,
        textAlign = 'center',
        height = 500,
        overlay = true,
        overlayOpacity = 0.4
    } = config;

    const combinedStyles = {
        height: `${height}px`,
        ...styling,
    };

    return (
        <div className={styles.banner} style={combinedStyles}>
            {image && (
                <>
                    <Image
                        src={image}
                        alt={title || 'Banner'}
                        fill
                        className={styles.image}
                        style={{ objectFit: 'cover' }}
                        priority
                        sizes="100vw"
                    />
                    {overlay && (
                        <div className={styles.overlay} style={{ opacity: overlayOpacity }} />
                    )}
                </>
            )}

            <div className={`${styles.content} ${styles[textAlign]}`}>
                {title && <h1 className={styles.title}>{title}</h1>}
                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                {buttonText && buttonLink && (
                    <Link href={buttonLink} className={styles.button}>
                        {buttonText}
                    </Link>
                )}
            </div>
        </div>
    );
}
