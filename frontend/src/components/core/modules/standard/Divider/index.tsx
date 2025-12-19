// Divider Module - Horizontal line separator

import styles from './Divider.module.scss';

interface DividerConfig {
    style?: 'solid' | 'dashed' | 'dotted';
    thickness?: number;
    color?: string;
    width?: 'full' | '50%' | '75%';
    alignment?: 'left' | 'center' | 'right';
    marginTop?: number;
    marginBottom?: number;
}

interface DividerProps {
    config: DividerConfig;
    styling?: any;
}

export default function Divider({ config, styling }: DividerProps) {
    const {
        style: borderStyle = 'solid',
        thickness = 1,
        color = '#e0e0e0',
        width = 'full',
        alignment = 'center',
        marginTop = 16,
        marginBottom = 16
    } = config;

    return (
        <div
            className={`${styles.dividerWrapper} ${styles[alignment]}`}
            style={{
                marginTop: `${marginTop}px`,
                marginBottom: `${marginBottom}px`,
                ...styling,
            }}
        >
            <hr
                className={styles.divider}
                style={{
                    borderStyle,
                    borderWidth: `${thickness}px 0 0 0`,
                    borderColor: color,
                    width,
                }}
            />
        </div>
    );
}
