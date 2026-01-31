import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    slug: string;
    domains: string[];
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
        allowCustomerLogin?: boolean;
        allowCustomerSignup?: boolean;
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
        googleAnalytics?: {
            enabled: boolean;
            trackingId?: string;
        };
        aiSettings?: {
            enabled: boolean;
            openaiKey?: string;
            model?: string;
        };
        contact?: {
            address?: string;
            phone?: string;
            email?: string;
        };
        returnSettings?: {
            enabled: boolean;
            defaultReturnWindow: number; // days (default: 7)
            defaultExchangeWindow: number; // days (default: 7)
            allowPartialReturns: boolean;
            requireReturnReason: boolean;
            autoApproveReturns: boolean;
            returnPolicyText?: string;
            pickupEnabled: boolean;
            dropOffEnabled: boolean;
            refundMethods: ('original' | 'store_credit' | 'bank_transfer')[];
            returnConditions?: string[];
            exchangeConditions?: string[];
            processSteps?: { label: string; description?: string }[];
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

        // Scroll to Top Configuration
        scrollToTop?: {
            enabled: boolean;
            position: 'bottom-left' | 'bottom-center' | 'bottom-right';
            xAxis: number;
            yAxis: number;
            colors: {
                icon: string;
                background: string;
            };
            borderRadius: number;
        };
    };

    // PWA Configuration
    pwaSettings?: {
        enabled: boolean;
        appName?: string;
        appShortName?: string;
        themeColor?: string;
        backgroundColor?: string;
        icons?: {
            icon192?: string;  // 192x192 icon
            icon512?: string;  // 512x512 icon
            appleTouchIcon?: string;  // 180x180 Apple touch icon
        };
        installPromptStyle?: 'toast' | 'banner' | 'modal';
    };

    // Cookie Consent Configuration
    cookieConsentSettings?: {
        enabled: boolean;
        title?: string;
        description?: string;
        ctaLink?: string;
        ctaText?: string;
        icon?: string; // Icon identifier from icon picker
        position: 'bottom-left' | 'bottom-center' | 'bottom-right';
        width: 'full' | 'half' | 'custom';
        customWidth?: number; // in pixels, only used when width is 'custom'
        backgroundColor?: string;
        textColor?: string;
        buttonColor?: string;
        buttonTextColor?: string;
    };

    // POS (Point of Sale) Configuration
    posSettings?: {
        enabled: boolean;
        allowQuickCheckout: boolean;
        requireCustomerDetails: boolean;
        defaultPaymentMethod: 'cash' | 'card' | 'qr';
        enableRoundOff: boolean;        // Round total to nearest whole number for easy cash handling
        receiptSettings: {
            headerText?: string;
            footerText?: string;
            showLogo: boolean;
            paperWidth: '58mm' | '80mm';
        };
        barcodeSettings: {
            format: 'CODE128' | 'EAN13' | 'QR';
            printWidth: number;
            printHeight: number;
        };
    };

    // POS Payment Configuration
    posPaymentSettings?: {
        enabledMethods: {
            cash: boolean;      // Default: true
            card: boolean;      // Default: true  
            qr: boolean;        // Default: false
        };
        cashSettings: {
            enableRoundOff: boolean;
            roundOffTo: 'nearest1' | 'nearest5' | 'nearest10';
            requireExactAmount: boolean;
        };
        cardSettings: {
            terminalType: 'manual' | 'integrated';
            terminalId?: string;
            gatewayId?: Schema.Types.ObjectId;
        };
        qrSettings: {
            mode: 'gateway' | 'custom';

            // Gateway-based QR
            gatewayConfig?: {
                gatewayId: Schema.Types.ObjectId;
                gatewayType: 'razorpay' | 'stripe' | 'paypal';

                razorpayOptions?: {
                    qrType: 'upi_qr' | 'bharat_qr';
                };
                stripeOptions?: {
                    method: 'terminal' | 'payment_link';
                };
                paypalOptions?: {
                    method: 'paypal_qr' | 'venmo_qr';
                };
            };

            // Custom static QR code
            customConfig?: {
                qrCodeImage: string;
                paymentIdentifier?: string;
                paymentType?: string;
                merchantName?: string;
                description?: string;
            };

            // Verification settings
            verification: {
                mode: 'manual' | 'auto' | 'webhook';
                pollingInterval?: number;
                timeout?: number;
            };

            // Display settings
            displaySettings: {
                showAmount: boolean;
                showMerchantName: boolean;
                showPaymentId: boolean;
                instructions?: string;
                qrLabel?: string;
            };
        };
    };

    createdAt: Date;
    updatedAt: Date;
    lastProductModified?: Date;
    lastCategoryModified?: Date;
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
        domains: {
            type: [String],
            required: true,
            validate: {
                validator: function (v: string[]) {
                    return v && v.length > 0;
                },
                message: 'At least one domain is required'
            },
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
                allowCustomerLogin: true,
                allowCustomerSignup: true,
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
                googleAnalytics: {
                    enabled: false,
                    trackingId: '',
                },
            },
        },
        // Theme configuration for header, footer, colors, fonts
        theme: {
            type: Schema.Types.Mixed,
            default: null,
        },
        // PWA configuration
        pwaSettings: {
            enabled: { type: Boolean, default: false },
            appName: { type: String, trim: true },
            appShortName: { type: String, trim: true, maxlength: 12 },
            themeColor: { type: String, trim: true },
            backgroundColor: { type: String, trim: true },
            icons: {
                icon192: { type: String },
                icon512: { type: String },
                appleTouchIcon: { type: String },
            },
            installPromptStyle: {
                type: String,
                enum: ['toast', 'banner', 'modal'],
                default: 'toast',
            },
        },
        // Cookie Consent configuration
        cookieConsentSettings: {
            enabled: { type: Boolean, default: false },
            title: { type: String, trim: true },
            description: { type: String, trim: true }, // Can contain HTML from RTE
            ctaLink: { type: String, trim: true },
            ctaText: { type: String, trim: true, default: 'Accept' },
            icon: { type: String, trim: true }, // Icon identifier
            position: {
                type: String,
                enum: ['bottom-left', 'bottom-center', 'bottom-right'],
                default: 'bottom-center',
            },
            width: {
                type: String,
                enum: ['full', 'half', 'custom'],
                default: 'half',
            },
            customWidth: { type: Number }, // in pixels
            backgroundColor: { type: String, trim: true, default: '#1f2937' },
            textColor: { type: String, trim: true, default: '#ffffff' },
            buttonColor: { type: String, trim: true, default: '#3b82f6' },
            buttonTextColor: { type: String, trim: true, default: '#ffffff' },
        },
        // POS configuration
        posSettings: {
            enabled: { type: Boolean, default: false },
            allowQuickCheckout: { type: Boolean, default: true },
            requireCustomerDetails: { type: Boolean, default: false },
            defaultPaymentMethod: {
                type: String,
                enum: ['cash', 'card', 'qr'],
                default: 'cash',
            },

            receiptSettings: {
                headerText: { type: String, trim: true },
                footerText: { type: String, trim: true },
                showLogo: { type: Boolean, default: true },
                paperWidth: {
                    type: String,
                    enum: ['58mm', '80mm'],
                    default: '80mm',
                },
            },
            barcodeSettings: {
                format: {
                    type: String,
                    enum: ['CODE128', 'EAN13', 'QR'],
                    default: 'CODE128',
                },
                printWidth: { type: Number, default: 40 },
                printHeight: { type: Number, default: 30 },
            },
        },
        // POS Payment Settings
        posPaymentSettings: {
            enabledMethods: {
                cash: { type: Boolean, default: true },
                card: { type: Boolean, default: true },
                qr: { type: Boolean, default: false },
            },
            cashSettings: {
                enableRoundOff: { type: Boolean, default: false },
                roundOffTo: {
                    type: String,
                    enum: ['nearest1', 'nearest5', 'nearest10'],
                    default: 'nearest10',
                },
                requireExactAmount: { type: Boolean, default: false },
            },
            cardSettings: {
                terminalType: {
                    type: String,
                    enum: ['manual', 'integrated'],
                    default: 'manual',
                },
                terminalId: String,
                gatewayId: { type: Schema.Types.ObjectId, ref: 'PaymentGatewayConfig' },
            },
            qrSettings: {
                mode: {
                    type: String,
                    enum: ['gateway', 'custom'],
                    default: 'custom',
                },
                gatewayConfig: {
                    gatewayId: { type: Schema.Types.ObjectId, ref: 'PaymentGatewayConfig' },
                    gatewayType: {
                        type: String,
                        enum: ['razorpay', 'stripe', 'paypal'],
                    },
                    razorpayOptions: {
                        qrType: { type: String, enum: ['upi_qr', 'bharat_qr'] },
                    },
                    stripeOptions: {
                        method: { type: String, enum: ['terminal', 'payment_link'] },
                    },
                    paypalOptions: {
                        method: { type: String, enum: ['paypal_qr', 'venmo_qr'] },
                    },
                },
                customConfig: {
                    qrCodeImage: String,
                    paymentIdentifier: String,
                    paymentType: String,
                    merchantName: String,
                    description: String,
                },
                verification: {
                    mode: {
                        type: String,
                        enum: ['manual', 'auto', 'webhook'],
                        default: 'manual',
                    },
                    pollingInterval: { type: Number, default: 3000 },
                    timeout: { type: Number, default: 600 }, // 10 minutes
                },
                displaySettings: {
                    showAmount: { type: Boolean, default: true },
                    showMerchantName: { type: Boolean, default: true },
                    showPaymentId: { type: Boolean, default: true },
                    instructions: String,
                    qrLabel: { type: String, default: 'Scan to Pay' },
                },
            },
        },
        lastProductModified: {
            type: Date,
            default: Date.now,
            index: true,
        },
        lastCategoryModified: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for performance

StoreSchema.index({ domains: 1 });
StoreSchema.index({ isActive: 1 });

const Store = mongoose.model<IStore>('Store', StoreSchema);

export default Store;
