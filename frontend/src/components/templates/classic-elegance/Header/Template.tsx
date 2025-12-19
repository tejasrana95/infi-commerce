// Classic Elegance Header Template
// Pure HTML structure - bind your own data

'use client';

import React, { useState } from 'react';

export default function ClassicEleganceHeaderTemplate() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Your color palette
    const colors = {
        primary: '#334155',
        secondary: '#94a3b8',
        accent: '#d97706',
        background: '#f8fafc',
        text: '#1e293b',
    };

    return (
        <header>
            {/* ========== TOP BAR ========== */}
            <div style={{ backgroundColor: colors.accent }} className="text-white text-sm py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    {/* Left - Social Icons */}
                    <div className="hidden md:flex items-center gap-3">
                        <a href="#" className="hover:opacity-80">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                        </a>
                        <a href="#" className="hover:opacity-80">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        </a>
                        <a href="#" className="hover:opacity-80">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
                        </a>
                        <a href="#" className="hover:opacity-80">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                        </a>
                    </div>

                    {/* Center - Promo Text */}
                    <div className="flex-1 text-center">
                        <span>🎉 Get 10% off on your first marble idol purchase use </span>
                        <strong>WELCOME10</strong>
                        <a href="#" className="ml-2 underline hover:no-underline">Shop Now »</a>
                        <button className="ml-2 text-white/80 hover:text-white">×</button>
                    </div>

                    {/* Right - Phone & Currency */}
                    <div className="hidden md:flex items-center gap-4 text-xs">
                        <span>📞 CALL NOW: +91 942 932 0217</span>
                        <select className="bg-transparent border-none text-white text-xs cursor-pointer focus:outline-none">
                            <option className="text-gray-900">₹ INR (INDIAN RUPEE)</option>
                            <option className="text-gray-900">$ USD</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* ========== MAIN HEADER ========== */}
            <div className="bg-white border-b border-gray-200 py-3">
                <div className="container mx-auto px-4 flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Logo */}
                    <a href="/" className="flex-shrink-0">
                        <span className="text-2xl font-bold" style={{ color: colors.text }}>MURTIYA</span>
                    </a>

                    {/* Search Bar - Desktop */}
                    <div className="hidden md:flex flex-1 max-w-2xl">
                        <select
                            className="px-4 py-2.5 text-sm text-white rounded-l"
                            style={{ backgroundColor: colors.accent }}
                        >
                            <option>All</option>
                            <option>Marble Idols</option>
                            <option>Brass Idols</option>
                            <option>Clothes</option>
                            <option>Jewellery</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="flex-1 px-4 py-2.5 border-2 border-l-0 border-gray-200 focus:outline-none focus:border-gray-300"
                        />
                        <button
                            className="px-5 py-2.5 rounded-r text-white"
                            style={{ backgroundColor: colors.accent }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-auto">
                        {/* Account */}
                        <a href="/account" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <div className="hidden lg:block text-sm">
                                <div className="text-gray-500 text-xs">Login / Register</div>
                                <div className="font-medium">Account</div>
                            </div>
                        </a>

                        {/* Wishlist */}
                        <a href="/wishlist" className="flex items-center gap-2 hover:opacity-80" style={{ color: colors.accent }}>
                            <div className="relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <div className="hidden lg:block text-sm">
                                <div className="text-gray-500 text-xs">Your Wishlist</div>
                                <div className="font-medium">Wishlist</div>
                            </div>
                        </a>

                        {/* Cart */}
                        <a href="/cart" className="flex items-center gap-2 text-gray-700">
                            <div className="relative">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span
                                    className="absolute -top-2 -right-2 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                                    style={{ backgroundColor: colors.accent }}
                                >
                                    0
                                </span>
                            </div>
                            <div className="hidden lg:block text-sm">
                                <div className="text-gray-500 text-xs">0 Item(s)</div>
                                <div className="font-medium" style={{ color: colors.accent }}>₹0.00</div>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Mobile Search */}
                <div className="md:hidden px-4 mt-3">
                    <div className="flex">
                        <input
                            type="text"
                            placeholder="Search here..."
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-l focus:outline-none"
                        />
                        <button
                            className="px-4 py-2 rounded-r text-white"
                            style={{ backgroundColor: colors.accent }}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* ========== NAVIGATION BAR ========== */}
            <nav className="hidden md:block text-white" style={{ backgroundColor: colors.accent }}>
                <div className="container mx-auto px-4">
                    <ul className="flex items-center text-sm">
                        {/* Main Categories */}
                        <li><a href="#" className="block py-3 px-4 hover:bg-black/10 uppercase font-medium">Marble Idols</a></li>
                        <li><a href="#" className="block py-3 px-4 hover:bg-black/10 uppercase font-medium">Brass / Other Idols</a></li>
                        <li><a href="#" className="block py-3 px-4 hover:bg-black/10 uppercase font-medium">Clothes</a></li>
                        <li><a href="#" className="block py-3 px-4 hover:bg-black/10 uppercase font-medium">Jewellery/Accessories</a></li>

                        {/* Right side links */}
                        <li className="ml-auto flex items-center">
                            <a href="#" className="block py-3 px-3 hover:bg-black/10 uppercase text-xs">About</a>
                            <a href="#" className="block py-3 px-3 hover:bg-black/10 uppercase text-xs">FAQ</a>
                            <a href="#" className="block py-3 px-3 hover:bg-black/10 uppercase text-xs">Contact</a>
                            <a href="#" className="block py-3 px-3 hover:bg-black/10 uppercase text-xs">Blog</a>
                            <span className="py-3 px-3 text-xs">0 Item(s) - ₹0.00</span>
                            <a href="/cart" className="p-2 bg-white/20 rounded">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </a>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* ========== MOBILE MENU ========== */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
                    <div className="px-4 py-2">
                        <a href="#" className="block py-3 border-b border-gray-100 font-medium">Marble Idols</a>
                        <a href="#" className="block py-3 border-b border-gray-100 font-medium">Brass / Other Idols</a>
                        <a href="#" className="block py-3 border-b border-gray-100 font-medium">Clothes</a>
                        <a href="#" className="block py-3 border-b border-gray-100 font-medium">Jewellery/Accessories</a>
                        <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600">
                            <a href="#" className="block py-2">About</a>
                            <a href="#" className="block py-2">FAQ</a>
                            <a href="#" className="block py-2">Contact</a>
                            <a href="#" className="block py-2">Blog</a>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
