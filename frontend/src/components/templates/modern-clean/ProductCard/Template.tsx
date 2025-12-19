// Modern Clean ProductCard Template - Pure presentation
// Large images, hover effects, rounded corners

import { ProductTemplateProps } from '@/components/templates/core/ProductCard/types';

export default function ModernCleanProductCardTemplate({
    name,
    formattedPrice,
    formattedCompareAtPrice,
    hasDiscount,
    discountPercent,
    imageUrl,
    imageAlt,
    productUrl,
}: ProductTemplateProps) {
    return (
        <div className="group">
            {/* Image Container */}
            <div className="relative aspect-[3/4] bg-gray-50 rounded-2xl overflow-hidden mb-4">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {hasDiscount && discountPercent && (
                        <span className="bg-black text-white text-[10px] font-medium px-2 py-1 rounded-full">
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                {/* Quick Actions - Show on Hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="w-full bg-white text-black text-sm py-3 rounded-full hover:bg-gray-100 transition-colors">
                        Quick Add
                    </button>
                </div>

                {/* Wishlist Button */}
                <button className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="text-center">
                <a href={productUrl}>
                    <h3 className="text-sm font-medium text-gray-900 hover:underline line-clamp-1 mb-1">
                        {name}
                    </h3>
                </a>

                {/* Price */}
                <div className="flex items-center justify-center gap-2 text-sm">
                    <span className={hasDiscount ? 'text-red-500 font-medium' : 'text-gray-900'}>
                        {formattedPrice}
                    </span>
                    {hasDiscount && formattedCompareAtPrice && (
                        <span className="text-gray-400 line-through">{formattedCompareAtPrice}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
