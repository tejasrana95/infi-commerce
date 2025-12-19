'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { ModuleProps } from '../..';
import api from '@/lib/api';

interface TestimonialsConfig {
    testimonialIds: string[];
    layout: 'grid' | 'carousel';
    autoplay?: boolean;
}

interface TestimonialData {
    _id: string;
    customerName: string;
    customerTitle?: string;
    customerImage?: string;
    content: string;
    rating?: number;
}

export default function TestimonialsModule({ config }: ModuleProps) {
    const { testimonialIds, layout, autoplay = true } = config as TestimonialsConfig;
    const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                const ids = testimonialIds.join(',');
                const data = await api.get<TestimonialData[] | { testimonials: TestimonialData[] }>(`testimonials?ids=${ids}`);
                setTestimonials(Array.isArray(data) ? data : data.testimonials || []);
            } catch (err) {
                console.error('Error fetching testimonials:', err);
                setError(err instanceof Error ? err.message : 'Failed to load testimonials');
            } finally {
                setLoading(false);
            }
        };

        if (testimonialIds && testimonialIds.length > 0) {
            fetchTestimonials();
        } else {
            setLoading(false);
        }
    }, [testimonialIds]);

    // Auto-play for carousel layout
    useEffect(() => {
        if (layout === 'carousel' && autoplay && testimonials.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % testimonials.length);
            }, 5000);

            return () => clearInterval(timer);
        }
    }, [layout, autoplay, testimonials.length]);

    if (loading) {
        return (
            <div className="w-full py-12">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error || testimonials.length === 0) {
        if (process.env.NODE_ENV === 'development') {
            return (
                <div className="w-full p-8">
                    <div className="max-w-7xl mx-auto bg-red-50 border border-red-200 rounded-lg p-8">
                        <p className="text-red-600">Error loading testimonials: {error || 'No testimonials found'}</p>
                    </div>
                </div>
            );
        }
        return null;
    }

    const renderStars = (rating?: number) => {
        if (!rating) return null;

        return (
            <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
            </div>
        );
    };

    const TestimonialCard = ({ testimonial }: { testimonial: TestimonialData }) => (
        <div className="bg-white rounded-lg shadow-lg p-8 h-full">
            {renderStars(testimonial.rating)}

            <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

            <div className="flex items-center gap-4">
                {testimonial.customerImage ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                        <Image
                            src={testimonial.customerImage}
                            alt={testimonial.customerName}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-lg">
                            {testimonial.customerName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div>
                    <p className="font-semibold text-gray-900">{testimonial.customerName}</p>
                    {testimonial.customerTitle && (
                        <p className="text-sm text-gray-600">{testimonial.customerTitle}</p>
                    )}
                </div>
            </div>
        </div>
    );

    if (layout === 'carousel') {
        return (
            <div className="w-full py-12 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="relative">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={testimonial._id}
                                className={`transition-opacity duration-500 ${index === currentIndex ? 'opacity-100' : 'opacity-0 absolute inset-0'
                                    }`}
                            >
                                <TestimonialCard testimonial={testimonial} />
                            </div>
                        ))}

                        {testimonials.length > 1 && (
                            <div className="flex justify-center gap-2 mt-6">
                                {testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentIndex(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                                            ? 'bg-blue-600 w-8'
                                            : 'bg-gray-300 hover:bg-gray-400'
                                            }`}
                                        aria-label={`Go to testimonial ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Grid layout
    return (
        <div className="w-full py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial) => (
                        <TestimonialCard key={testimonial._id} testimonial={testimonial} />
                    ))}
                </div>
            </div>
        </div>
    );
}
