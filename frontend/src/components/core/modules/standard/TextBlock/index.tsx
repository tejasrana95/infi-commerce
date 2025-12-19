// Text Block Module - Rich text content

import styles from './TextBlock.module.scss';

interface TextBlockConfig {
    content: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontSize?: 'small' | 'medium' | 'large';
    fontWeight?: 'normal' | 'medium' | 'bold';
    padding?: number;
}

interface TextBlockProps {
    config: TextBlockConfig;
    styling?: any;
}

export default function TextBlock({ config, styling }: TextBlockProps) {
    const {
        content,
        alignment = 'left',
        fontSize = 'medium',
        fontWeight = 'normal',
        padding = 16
    } = config;

    const combinedStyles = {
        padding: `${padding}px`,
        ...styling,
    };

    return (
        <div
            className={`${styles.textBlock} ${styles[alignment]} ${styles[fontSize]} ${styles[fontWeight]}`}
            style={combinedStyles}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}
