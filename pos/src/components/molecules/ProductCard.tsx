import React from 'react';
import { Product } from '@/types';
import { AlertCircle } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import Badge from '../atoms/Badge';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const { formatPrice } = useCurrency();
    
    // Use pricing object for tax-inclusive display (consistent with frontend)
    const pricing = product.pricing;
    
    // Display prices: originalPrice for strikethrough, finalPrice for current price
    // finalPrice is salePriceWithTax when on sale, otherwise priceWithTax
    const displayPrice = pricing?.finalPrice ?? product.salePrice ?? product.price;
    const originalPrice = pricing?.originalPrice ?? product.price;
    const isOnSale = pricing?.isOnSale ?? (product.salePrice !== undefined && product.salePrice < product.price);
    
    // Show strikethrough only when on sale and originalPrice differs from displayPrice
    const showStrikethrough = isOnSale && originalPrice > displayPrice;

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all group active:scale-[0.98] flex flex-col h-full"
        >
            {/* Image */}
            <div className="aspect-square bg-gray-100 rounded-xl mb-3 overflow-hidden relative">
                <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {product.stock <= 5 && (
                    <div className="absolute top-2 right-2">
                        <Badge variant="danger" className="flex items-center gap-1 shadow-sm">
                            <AlertCircle className="w-3 h-3" /> Low Stock
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                    {product.name}
                </h3>
                <p className="text-xs text-slate-600 mb-3">{product.sku}</p>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                        {showStrikethrough ? (
                            <>
                                <span className="text-xs text-slate-500 line-through">
                                    {formatPrice(originalPrice)}
                                </span>
                                <span className="text-lg font-bold text-red-600">
                                    {formatPrice(displayPrice)}
                                </span>
                            </>
                        ) : (
                            <span className="text-lg font-bold text-blue-700">
                                {formatPrice(displayPrice)}
                            </span>
                        )}
                    </div>

                    <button className="bg-slate-100 hover:bg-blue-600 hover:text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-slate-800">
                        <span className="text-xl font-bold mb-0.5">+</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
