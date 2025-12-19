// Core ProductCard Template - Default/Fallback presentation
// Pure UI component - receives processed data, renders UI

import { ProductTemplateProps } from './types';

export default function CoreProductCardTemplate({
    name,
    formattedPrice,
    formattedCompareAtPrice,
    hasDiscount,
    discountPercent,
    imageUrl,
    imageAlt,
    rating,
    reviewCount,
    productUrl,
}: ProductTemplateProps) {
    return (
        <div className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image */}
            <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}

                {/* Discount Badge */}
                {hasDiscount && discountPercent && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{discountPercent}%
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <a href={productUrl}>
                    <h3 className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 mb-2">
                        {name}
                    </h3>
                </a>

                {/* Rating */}
                {rating !== undefined && (
                    <div className="flex items-center gap-1 mb-2">
                        <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-current' : 'fill-gray-300'}`}
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">({reviewCount || 0})</span>
                    </div>
                )}

                {/* Price */}
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{formattedPrice}</span>
                    {hasDiscount && formattedCompareAtPrice && (
                        <span className="text-sm text-gray-500 line-through">
                            {formattedCompareAtPrice}
                        </span>
                    )}
                </div>

                {/* Add to Cart */}
                <button className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors">
                    Add to Cart
                </button>
            </div>
        </div>
    );
}
