export interface HeaderTopBar {
    enabled: boolean;
    backgroundColor?: string;
    textColor?: string;
    height?: number;
    items: Array<any>;
}

export interface HeaderMainConfig {
    layout: 'default' | 'centered' | 'split' | 'minimal' | 'custom';
    backgroundColor?: string;
    height?: number;
    sticky?: boolean;
    transparent?: boolean;
    sections: Array<{
        id: string;
        position: 'left' | 'center' | 'right';
        items: Array<any>;
    }>;
}

export interface FooterConfig {
    sections: Array<any>;
}

export interface ThemeConfig {
    templateId: string;
    colors?: {
        primary?: string;
        secondary?: string;
        accent?: string;
        background?: string;
        text?: string;
    };
    fonts?: {
        heading?: string;
        body?: string;
    };
    header?: {
        topBar?: HeaderTopBar;
        main: HeaderMainConfig;
    };
    footer?: FooterConfig;
}

export interface Store {
    _id: string;
    name: string;
    theme?: ThemeConfig;
    // Add other store properties as needed
}
