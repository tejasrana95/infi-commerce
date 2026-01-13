// Classic Elegance ProductCard Template - Based on reference design
// White card with image, title, bullet points, and "View More" link

import { ProductTemplateProps } from '@/components/templates/core/ProductCard/types';

export default function ClassicEleganceProductCardTemplate({
    name,
    formattedPrice,
    formattedCompareAtPrice,
    hasDiscount,
    discountPercent,
    imageUrl,
    imageAlt,
    productUrl,
    rating,
    reviewCount,
    isNew,
    cardConfig,
}: ProductTemplateProps) {
    const {
        showRating = true,
        showRatingValue = true,
    } = cardConfig || {};

    // Generate mock bullet points (in real app, these would come from product description)
    const bulletPoints = [
        `Premium quality ${name.split(' ').slice(0, 2).join(' ')}...`,
        'Hand-crafted with precision',
        'Available in multiple sizes',
    ];

    return (
        <div className="bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            {/* Image Container */}
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={imageAlt}
                        className="w-full h-full object-contain p-4"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {isNew && (
                        <span className="bg-green-500 text-white text-xs font-bold px-2 py-1">NEW</span>
                    )}
                    {hasDiscount && discountPercent && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1">
                            -{discountPercent}%
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 border-t border-gray-100">
                {/* Title */}
                <h3 className="font-medium text-gray-800 text-sm mb-2 line-clamp-1">{name}</h3>

                {/* Rating */}
                {showRating && rating !== undefined && (
                    <div className="flex items-center gap-1 mb-2">
                        {showRatingValue && (
                            <span className="text-xs font-bold text-gray-900">{rating.toFixed(1)}</span>
                        )}
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-current' : 'fill-gray-200'}`}
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-[10px] text-gray-400">({reviewCount || 0})</span>
                    </div>
                )}

                {/* Bullet Points */}
                <ul className="text-xs text-gray-600 space-y-1 mb-3">
                    {bulletPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-1">
                            <span className="text-amber-500 mt-0.5">•</span>
                            <span className="line-clamp-1">{point}</span>
                        </li>
                    ))}
                </ul>

                {/* Price (if shown) */}
                {formattedPrice && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`font-semibold ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                            {formattedPrice}
                        </span>
                        {hasDiscount && formattedCompareAtPrice && (
                            <span className="text-gray-400 line-through text-sm">{formattedCompareAtPrice}</span>
                        )}
                    </div>
                )}

                {/* View More Link */}
                <a
                    href={productUrl}
                    className="inline-flex items-center text-amber-500 text-sm font-medium hover:text-amber-600 transition-colors"
                >
                    View More
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </a>
            </div>
        </div>
    );
}
