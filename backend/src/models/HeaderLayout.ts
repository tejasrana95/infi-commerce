import mongoose, { Schema, Document } from 'mongoose';
import { IModule } from './Layout';

/**
 * Header Layout Model - Global header configuration
 * Includes top bar, main header, and navigation sections
 */
export interface IHeaderLayout extends Document {
    storeId: mongoose.Types.ObjectId;
    name: string;

    sections: {
        // Top announcement bar
        topBar: {
            enabled: boolean;
            backgroundColor?: string;
            textColor?: string;
            content?: string;           // Simple text or HTML
            link?: string;
            dismissible: boolean;
            modules?: IModule[];
        };

        // Main header section
        main: {
            backgroundColor?: string;
            textColor?: string;
            sticky: boolean;
            stickyOnScroll: boolean;    // Only sticky after scrolling down
            height?: number;            // px

            layout: 'logo-left' | 'logo-center' | 'logo-right';

            // Logo settings
            logo: {
                image?: string;
                mobileImage?: string;
                width?: number;
                height?: number;
                alt?: string;
            };

            // Search settings
            showSearch: boolean;
            searchStyle: 'inline' | 'icon' | 'expandable';
            searchPlaceholder?: string;

            // Cart settings
            showCart: boolean;
            cartStyle: 'icon' | 'icon-text' | 'icon-count';

            // Account settings
            showAccount: boolean;
            accountStyle: 'icon' | 'icon-text';

            // Wishlist settings
            showWishlist: boolean;

            // Custom modules
            modules?: IModule[];
        };

        // Navigation bar (below main header)
        navigation: {
            enabled: boolean;
            backgroundColor?: string;
            textColor?: string;
            hoverColor?: string;
            menuId?: mongoose.Types.ObjectId;
            menuStyle: 'horizontal' | 'mega' | 'flyout';
            showAllCategories: boolean; // "All Categories" dropdown
            allCategoriesLabel?: string;
        };
    };

    // Mobile settings
    mobileSettings: {
        hamburgerPosition: 'left' | 'right';
        mobileMenuStyle: 'slide-left' | 'slide-right' | 'fullscreen' | 'dropdown';
        showSearchInMobile: boolean;
        stickyMobileHeader: boolean;
        mobileMenuId?: mongoose.Types.ObjectId;
    };

    // Custom CSS/JS
    customCSS?: string;

    isDefault: boolean;
    isActive: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const HeaderLayoutSchema = new Schema<IHeaderLayout>(
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
            topBar: {
                enabled: { type: Boolean, default: false },
                backgroundColor: { type: String, default: '#1F2937' },
                textColor: { type: String, default: '#FFFFFF' },
                content: { type: String, trim: true },
                link: { type: String, trim: true },
                dismissible: { type: Boolean, default: true },
                modules: { type: [Schema.Types.Mixed], default: [] },
            },

            main: {
                backgroundColor: { type: String, default: '#FFFFFF' },
                textColor: { type: String, default: '#111827' },
                sticky: { type: Boolean, default: true },
                stickyOnScroll: { type: Boolean, default: false },
                height: { type: Number, default: 70 },

                layout: {
                    type: String,
                    enum: ['logo-left', 'logo-center', 'logo-right'],
                    default: 'logo-left',
                },

                logo: {
                    image: { type: String, trim: true },
                    mobileImage: { type: String, trim: true },
                    width: { type: Number, default: 150 },
                    height: { type: Number, default: 40 },
                    alt: { type: String, trim: true },
                },

                showSearch: { type: Boolean, default: true },
                searchStyle: {
                    type: String,
                    enum: ['inline', 'icon', 'expandable'],
                    default: 'inline',
                },
                searchPlaceholder: { type: String, default: 'Search products...', trim: true },

                showCart: { type: Boolean, default: true },
                cartStyle: {
                    type: String,
                    enum: ['icon', 'icon-text', 'icon-count'],
                    default: 'icon-count',
                },

                showAccount: { type: Boolean, default: true },
                accountStyle: {
                    type: String,
                    enum: ['icon', 'icon-text'],
                    default: 'icon',
                },

                showWishlist: { type: Boolean, default: false },

                modules: { type: [Schema.Types.Mixed], default: [] },
            },

            navigation: {
                enabled: { type: Boolean, default: true },
                backgroundColor: { type: String, default: '#F9FAFB' },
                textColor: { type: String, default: '#374151' },
                hoverColor: { type: String, default: '#3B82F6' },
                menuId: { type: Schema.Types.ObjectId, ref: 'Menu' },
                menuStyle: {
                    type: String,
                    enum: ['horizontal', 'mega', 'flyout'],
                    default: 'horizontal',
                },
                showAllCategories: { type: Boolean, default: true },
                allCategoriesLabel: { type: String, default: 'All Categories', trim: true },
            },
        },

        mobileSettings: {
            hamburgerPosition: {
                type: String,
                enum: ['left', 'right'],
                default: 'left',
            },
            mobileMenuStyle: {
                type: String,
                enum: ['slide-left', 'slide-right', 'fullscreen', 'dropdown'],
                default: 'slide-left',
            },
            showSearchInMobile: { type: Boolean, default: true },
            stickyMobileHeader: { type: Boolean, default: true },
            mobileMenuId: { type: Schema.Types.ObjectId, ref: 'Menu' },
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
HeaderLayoutSchema.index({ storeId: 1, isDefault: 1 });
HeaderLayoutSchema.index({ storeId: 1, isActive: 1 });

// Ensure only one default per store
HeaderLayoutSchema.pre('save', async function (next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await mongoose.model('HeaderLayout').updateMany(
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

const HeaderLayout = mongoose.model<IHeaderLayout>('HeaderLayout', HeaderLayoutSchema);

export default HeaderLayout;
