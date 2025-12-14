import mongoose, { Schema, Document } from 'mongoose';

/**
 * Theme Model - Visual theme configuration for storefront
 * Supports theme marketplace and customization
 */
export interface ITheme extends Document {
    storeId?: mongoose.Types.ObjectId;  // null = system theme
    name: string;
    slug: string;
    version: string;
    author: string;
    description?: string;
    thumbnail?: string;

    isSystemTheme: boolean;             // Built-in vs custom
    supportedModules: string[];         // Which modules this theme supports

    // Default theme settings
    settings: {
        colors: {
            primary: string;
            secondary: string;
            accent: string;
            background: string;
            surface: string;
            text: string;
            textSecondary: string;
            border: string;
            error: string;
            success: string;
            warning: string;
        };
        fonts: {
            heading: string;
            body: string;
            headingWeight: number;
            bodyWeight: number;
        };
        layout: {
            containerWidth: number;     // max-width in px
            borderRadius: string;       // 'none' | 'sm' | 'md' | 'lg' | 'full'
            spacing: string;            // 'compact' | 'normal' | 'relaxed'
        };
        buttons: {
            style: string;              // 'filled' | 'outline' | 'ghost'
            borderRadius: string;
        };
    };

    stylesheetUrl?: string;             // External CSS URL
    customCSS?: string;                 // Custom CSS overrides

    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const ThemeSchema = new Schema<ITheme>(
    {
        storeId: {
            type: Schema.Types.ObjectId,
            ref: 'Store',
            default: null,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        version: {
            type: String,
            default: '1.0.0',
            trim: true,
        },
        author: {
            type: String,
            default: 'System',
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },
        thumbnail: {
            type: String,
            trim: true,
        },

        isSystemTheme: {
            type: Boolean,
            default: false,
        },
        supportedModules: {
            type: [String],
            default: [
                'banner', 'banner-slider', 'text-block', 'image', 'image-gallery',
                'video', 'spacer', 'divider', 'html', 'newsletter', 'testimonials',
                'countdown', 'brand-logos', 'product-carousel', 'product-grid',
                'category-showcase', 'featured-product', 'category-header',
                'category-products', 'product-details', 'search-results',
                'blog-listing', 'blog-content', 'menu', 'logo', 'search-bar',
                'cart-icon', 'account-icon', 'social-icons'
            ],
        },

        settings: {
            colors: {
                primary: { type: String, default: '#3B82F6' },
                secondary: { type: String, default: '#6366F1' },
                accent: { type: String, default: '#F59E0B' },
                background: { type: String, default: '#FFFFFF' },
                surface: { type: String, default: '#F9FAFB' },
                text: { type: String, default: '#111827' },
                textSecondary: { type: String, default: '#6B7280' },
                border: { type: String, default: '#E5E7EB' },
                error: { type: String, default: '#EF4444' },
                success: { type: String, default: '#10B981' },
                warning: { type: String, default: '#F59E0B' },
            },
            fonts: {
                heading: { type: String, default: 'Inter' },
                body: { type: String, default: 'Inter' },
                headingWeight: { type: Number, default: 600 },
                bodyWeight: { type: Number, default: 400 },
            },
            layout: {
                containerWidth: { type: Number, default: 1280 },
                borderRadius: { type: String, default: 'md', enum: ['none', 'sm', 'md', 'lg', 'full'] },
                spacing: { type: String, default: 'normal', enum: ['compact', 'normal', 'relaxed'] },
            },
            buttons: {
                style: { type: String, default: 'filled', enum: ['filled', 'outline', 'ghost'] },
                borderRadius: { type: String, default: 'md', enum: ['none', 'sm', 'md', 'lg', 'full'] },
            },
        },

        stylesheetUrl: {
            type: String,
            trim: true,
        },
        customCSS: {
            type: String,
            maxlength: 50000,
        },

        isActive: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
ThemeSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ThemeSchema.index({ storeId: 1, isActive: 1 });
ThemeSchema.index({ isSystemTheme: 1 });

// Ensure only one active theme per store
ThemeSchema.pre('save', async function (next) {
    if (this.isActive && this.isModified('isActive')) {
        // Deactivate other themes for this store
        await mongoose.model('Theme').updateMany(
            {
                storeId: this.storeId,
                _id: { $ne: this._id },
                isActive: true
            },
            { isActive: false }
        );
    }
    next();
});

const Theme = mongoose.model<ITheme>('Theme', ThemeSchema);

export default Theme;
