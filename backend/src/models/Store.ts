import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    slug: string;
    domain: string;
    description?: string;
    logo?: string;
    favicon?: string;
    currency: string;
    timezone: string;
    isActive: boolean;

    // SEO Fields
    seo: {
        metaTitle?: string;
        metaDescription?: string;
        metaKeywords?: string[];
        ogImage?: string;
        ogTitle?: string;
        ogDescription?: string;
    };

    // Store Configuration
    settings: {
        emailNotifications?: boolean;
        orderNotifications?: boolean;
        smsNotifications?: boolean;
        whatsappNotifications?: boolean;
        maintenanceMode?: boolean;
        allowGuestCheckout?: boolean;
        requireEmailVerification?: boolean;
        minOrderAmount?: number;
        maxOrderAmount?: number;
        shippingEnabled?: boolean;
        emailSettings?: any;
        smsSettings?: any;
        whatsappSettings?: any;
        telegramSettings?: {
            enabled: boolean;
            botToken?: string;
            chatId?: string;
            notifications: {
                newOrder: boolean;
                orderStatus: boolean;
                returnRequest: boolean;
                orderCancel: boolean;
                newCustomer: boolean;
            }
        };
        adminNotificationSettings?: {
            emails: string; // comma separated
            notifications: {
                emailEnabled: boolean;
                newOrder: boolean;
                orderStatus: boolean;
                returnRequest: boolean;
                orderCancel: boolean;
                newCustomer: boolean;
            }
        };
        socialLogin?: {
            google: {
                enabled: boolean;
                clientId?: string;
                clientSecret?: string;
            };
            facebook: {
                enabled: boolean;
                clientId?: string;
                clientSecret?: string;
            };
        };
        [key: string]: any;
    };

    // Theme Configuration (Header, Footer, Colors, Fonts)
    theme?: {
        header?: {
            topBar?: {
                enabled: boolean;
                backgroundColor?: string;
                textColor?: string;
                height?: number;
                items?: any[];
            };
            main: {
                layout: 'default' | 'centered' | 'split' | 'minimal' | 'custom';
                backgroundColor?: string;
                height?: number;
                sticky?: boolean;
                transparent?: boolean;
                sections: Array<{
                    id: string;
                    position: 'left' | 'center' | 'right';
                    items: any[];
                }>;
            };
        };
        footer?: {
            sections: Array<{
                id: string;
                type: 'columns' | 'bottom-bar';
                backgroundColor?: string;
                textColor?: string;
                padding?: number;
                columns?: any[];
                rows?: Array<{ id: string; columns: any[] }>;
                bottomBarContent?: string;
            }>;
        };
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
        // Category page configuration
        category?: {
            header?: {
                showImage?: boolean;
                showDescription?: boolean;
                descriptionPosition?: 'top' | 'bottom' | 'below-image';
                descriptionStyle?: 'expanded' | 'collapsed';
                defaultExpanded?: boolean;
                expandLabel?: string;
                collapseLabel?: string;
            };
            grid?: {
                productsPerPage?: number;
                productsPerRow?: {
                    desktop?: 3 | 4 | 5;
                    tablet?: 2 | 3;
                    mobile?: 1 | 2;
                };
                cardStyle?: 'default' | 'compact' | 'detailed';
            };
            sorting?: {
                defaultSort?: 'featured' | 'newest' | 'oldest' | 'price-low' | 'price-high' | 'alphabetical' | 'bestselling';
                showSortDropdown?: boolean;
                availableSortOptions?: string[];
            };
            pagination?: {
                type?: 'pagination' | 'infinite-scroll' | 'load-more';
                position?: 'left' | 'center' | 'right';
                showProductCount?: boolean;
            };
            filters?: {
                enabled?: boolean;
                position?: 'left' | 'right' | 'top' | 'off-canvas';
                sidebarWidth?: number;
                style?: 'sticky' | 'static';
                defaultState?: 'expanded' | 'collapsed';
                showPriceRange?: boolean;
                priceRangeStyle?: 'slider' | 'input' | 'range-buttons';
                showCategoryFilter?: boolean;
                showAttributeFilters?: boolean;
                showTagFilter?: boolean;
                showBrandFilter?: boolean;
                showRatingFilter?: boolean;
                showAvailabilityFilter?: boolean;
            };
            subcategories?: {
                display?: 'filter' | 'cards' | 'both' | 'none';
                cardStyle?: 'image' | 'minimal';
                position?: 'above-products' | 'sidebar';
            };
            emptyState?: {
                message?: string;
                showClearFilters?: boolean;
            };
            seo?: {
                indexFilteredPages?: boolean;
            };
        };
        // Compare feature configuration
        compare?: {
            enabled?: boolean;
            maxProducts?: 2 | 3 | 4;
            maxProductsMobile?: 2;
            requireSameCategory?: boolean;
            showInProductCard?: boolean;
            showInProductPage?: boolean;
            widgetStyle?: 'floating' | 'drawer' | 'none';
            widgetPosition?: 'bottom' | 'bottom-right' | 'bottom-left';
        };
    };

    createdAt: Date;
    updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        domain: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        logo: {
            type: String,
        },
        favicon: {
            type: String,
        },
        currency: {
            type: String,
            required: true,
            default: 'USD',
            uppercase: true,
            maxlength: 3,
        },
        timezone: {
            type: String,
            required: true,
            default: 'UTC',
        },
        isActive: {
            type: Boolean,
            required: true,
            default: true,
        },
        seo: {
            metaTitle: { type: String, trim: true },
            metaDescription: { type: String, trim: true },
            metaKeywords: [{ type: String, trim: true }],
            ogImage: { type: String },
            ogTitle: { type: String, trim: true },
            ogDescription: { type: String, trim: true },
        },
        settings: {
            type: Schema.Types.Mixed,
            default: {
                emailNotifications: true,
                orderNotifications: true,
                maintenanceMode: false,
                allowGuestCheckout: true,
                requireEmailVerification: false,
                shippingEnabled: true,
                productPage: {
                    pricing: {
                        showTaxIncluded: false,
                        showPriceWithoutTax: false,
                    },
                    info: {
                        showSku: true,
                        showBrand: true,
                        showStock: true,
                        showReviews: true,
                        showSocialShare: false,
                    },
                    specifications: {
                        show: true,
                        layout: 'tab', // tab, list
                    },
                    gallery: {
                        enableZoom: true,
                        zoomType: 'hover', // hover, magnify, lightbox-only
                    },
                    shipping: {
                        showCalculator: true,
                    },
                },
                // Review settings
                reviewSettings: {
                    allowReviews: true,
                    allowGuestReviews: true,
                    requireGuestEmailVerification: false,
                    requireApproval: true,
                    minRating: 1,
                    maxRating: 5,
                    allowImages: true,
                    maxImagesPerReview: 5,
                },
                socialLogin: {
                    google: {
                        enabled: false,
                        clientId: '',
                        clientSecret: '',
                    },
                    facebook: {
                        enabled: false,
                        clientId: '',
                        clientSecret: '',
                    },
                },
            },
        },
        // Theme configuration for header, footer, colors, fonts
        theme: {
            type: Schema.Types.Mixed,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance
StoreSchema.index({ slug: 1 });
StoreSchema.index({ domain: 1 });
StoreSchema.index({ isActive: 1 });

const Store = mongoose.model<IStore>('Store', StoreSchema);

export default Store;
