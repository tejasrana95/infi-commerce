import mongoose, { Schema, Document } from 'mongoose';

/**
 * Footer Column - Individual column in footer
 */
export interface IFooterColumn {
    id: string;
    title?: string;
    type: 'menu' | 'text' | 'contact' | 'social' | 'newsletter' | 'logo' | 'custom';
    width: number;                      // Grid units (1-12) or percentage

    // For type: menu
    menuId?: mongoose.Types.ObjectId;

    // For type: text or custom
    content?: string;                   // Rich text HTML

    // For type: contact
    contactInfo?: {
        address?: string;
        phone?: string;
        email?: string;
        workingHours?: string;
    };

    // For type: newsletter
    newsletter?: {
        title?: string;
        description?: string;
        placeholder?: string;
        buttonText?: string;
        successMessage?: string;
    };

    // For type: logo
    logoSettings?: {
        image?: string;
        width?: number;
        showDescription?: boolean;
        description?: string;
    };
}

/**
 * Footer Layout Model - Global footer configuration
 */
export interface IFooterLayout extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;

    sections: {
        // Pre-footer (optional widgets area)
        preFooter?: {
            enabled: boolean;
            backgroundColor?: string;
            modules?: any[];            // Custom modules
        };

        // Main footer with columns
        main: {
            backgroundColor?: string;
            textColor?: string;
            linkColor?: string;
            linkHoverColor?: string;
            borderTopColor?: string;

            paddingTop?: number;
            paddingBottom?: number;

            columns: IFooterColumn[];
            columnsLayout: 'equal' | 'custom';
        };

        // Bottom bar (copyright, payment icons, etc.)
        bottom: {
            enabled: boolean;
            backgroundColor?: string;
            textColor?: string;

            // Left side content
            copyrightText?: string;

            // Payment icons
            showPaymentIcons: boolean;
            paymentIcons?: string[];    // ['visa', 'mastercard', 'paypal', etc.]

            // Social icons
            showSocialIcons: boolean;
            socialLinks?: {
                facebook?: string;
                instagram?: string;
                twitter?: string;
                youtube?: string;
                linkedin?: string;
                pinterest?: string;
                tiktok?: string;
            };
            socialIconsPosition: 'left' | 'center' | 'right';

            // Additional links
            bottomLinks?: Array<{
                label: string;
                url: string;
            }>;
        };
    };

    // Back to top button
    backToTop: {
        enabled: boolean;
        style: 'circle' | 'square' | 'rounded';
        position: 'left' | 'right';
    };

    // Custom CSS
    customCSS?: string;

    isDefault: boolean;
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

// Footer Column sub-schema
const FooterColumnSchema = new Schema<IFooterColumn>(
    {
        id: { type: String, required: true },
        title: { type: String, trim: true },
        type: {
            type: String,
            enum: ['menu', 'text', 'contact', 'social', 'newsletter', 'logo', 'custom'],
            default: 'text',
        },
        width: { type: Number, default: 3, min: 1, max: 12 },

        menuId: { type: Schema.Types.ObjectId, ref: 'Menu' },
        content: { type: String },

        contactInfo: {
            address: { type: String, trim: true },
            phone: { type: String, trim: true },
            email: { type: String, trim: true },
            workingHours: { type: String, trim: true },
        },

        newsletter: {
            title: { type: String, default: 'Subscribe to our newsletter', trim: true },
            description: { type: String, trim: true },
            placeholder: { type: String, default: 'Enter your email', trim: true },
            buttonText: { type: String, default: 'Subscribe', trim: true },
            successMessage: { type: String, default: 'Thank you for subscribing!', trim: true },
        },

        logoSettings: {
            image: { type: String, trim: true },
            width: { type: Number, default: 150 },
            showDescription: { type: Boolean, default: true },
            description: { type: String, trim: true },
        },
    },
    { _id: false }
);

const FooterLayoutSchema = new Schema<IFooterLayout>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        sections: {
            preFooter: {
                enabled: { type: Boolean, default: false },
                backgroundColor: { type: String, default: '#F3F4F6' },
                modules: { type: [Schema.Types.Mixed], default: [] },
            },

            main: {
                backgroundColor: { type: String, default: '#1F2937' },
                textColor: { type: String, default: '#D1D5DB' },
                linkColor: { type: String, default: '#FFFFFF' },
                linkHoverColor: { type: String, default: '#3B82F6' },
                borderTopColor: { type: String, default: '#374151' },

                paddingTop: { type: Number, default: 60 },
                paddingBottom: { type: Number, default: 40 },

                columns: { type: [FooterColumnSchema], default: [] },
                columnsLayout: {
                    type: String,
                    enum: ['equal', 'custom'],
                    default: 'equal',
                },
            },

            bottom: {
                enabled: { type: Boolean, default: true },
                backgroundColor: { type: String, default: '#111827' },
                textColor: { type: String, default: '#9CA3AF' },

                copyrightText: {
                    type: String,
                    default: '© {year} {storeName}. All rights reserved.',
                    trim: true,
                },

                showPaymentIcons: { type: Boolean, default: true },
                paymentIcons: {
                    type: [String],
                    default: ['visa', 'mastercard', 'amex', 'paypal'],
                },

                showSocialIcons: { type: Boolean, default: true },
                socialLinks: {
                    facebook: { type: String, trim: true },
                    instagram: { type: String, trim: true },
                    twitter: { type: String, trim: true },
                    youtube: { type: String, trim: true },
                    linkedin: { type: String, trim: true },
                    pinterest: { type: String, trim: true },
                    tiktok: { type: String, trim: true },
                },
                socialIconsPosition: {
                    type: String,
                    enum: ['left', 'center', 'right'],
                    default: 'right',
                },

                bottomLinks: [{
                    label: { type: String, trim: true },
                    url: { type: String, trim: true },
                }],
            },
        },

        backToTop: {
            enabled: { type: Boolean, default: true },
            style: {
                type: String,
                enum: ['circle', 'square', 'rounded'],
                default: 'circle',
            },
            position: {
                type: String,
                enum: ['left', 'right'],
                default: 'right',
            },
        },

        customCSS: {
            type: String,
            maxlength: 50000,
        },

        isDefault: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
FooterLayoutSchema.index({ storeId: 1, isDefault: 1 });
FooterLayoutSchema.index({ storeId: 1, isActive: 1 });

// Ensure only one default per store
FooterLayoutSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await mongoose.model('FooterLayout').updateMany(
            {
                storeId: this.storeId,
                _id: { $ne: this._id },
                isDefault: true
            },
            { isDefault: false }
        );
    }
    next();
});

const FooterLayout = mongoose.model<IFooterLayout>('FooterLayout', FooterLayoutSchema);

export default FooterLayout;
