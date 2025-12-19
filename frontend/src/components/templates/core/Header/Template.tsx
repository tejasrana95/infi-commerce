// Core Header Template - Default/Fallback presentation
// All data comes from props (processed by Container)

import { HeaderTemplateProps } from './types';

export default function CoreHeaderTemplate({
    storeName,
    logo,
    navLinks,
    secondaryLinks,
    topBar,
    search,
    isSticky,
    backgroundColor,
    cartCount,
    wishlistCount,
    isLoggedIn,
    labels,
}: HeaderTemplateProps) {
    return (
        <header className={`bg-white border-b border-gray-200 ${isSticky ? 'sticky top-0 z-50' : ''}`}>
            {/* Top Bar */}
            {topBar.enabled && (
                <div
                    className="text-sm py-2 px-4"
                    style={{
                        backgroundColor: topBar.backgroundColor || '#f3f4f6',
                        color: topBar.textColor || '#374151',
                    }}
                >
                    <div className="container mx-auto flex justify-between items-center">
                        <div className="flex gap-4">
                            {topBar.items.left.map((item) => (
                                <span key={item.id}>{item.content}</span>
                            ))}
                        </div>
                        <div>
                            {topBar.items.center.map((item) => (
                                <span key={item.id}>{item.content}</span>
                            ))}
                        </div>
                        <div className="flex gap-4">
                            {topBar.items.right.map((item) => (
                                <span key={item.id}>{item.content}</span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Header */}
            <div
                className="py-4 px-4"
                style={{ backgroundColor: backgroundColor || 'transparent' }}
            >
                <div className="container mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <a href="/" className="flex items-center">
                        {logo ? (
                            <img src={logo} alt={storeName} className="h-10" />
                        ) : (
                            <span className="text-xl font-bold">{storeName}</span>
                        )}
                    </a>

                    {/* Navigation */}
                    <nav className="hidden md:flex gap-6">
                        {navLinks.map((link, index) => (
                            <a key={index} href={link.url} className="text-gray-700 hover:text-gray-900">
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        {search.enabled && (
                            <button className="p-2 hover:bg-gray-100 rounded" aria-label={labels.search}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        )}

                        {/* Account */}
                        <a href="/account" className="p-2 hover:bg-gray-100 rounded" aria-label={labels.account}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </a>

                        {/* Wishlist */}
                        <a href="/wishlist" className="p-2 hover:bg-gray-100 rounded relative" aria-label={labels.wishlist}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            {wishlistCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {wishlistCount}
                                </span>
                            )}
                        </a>

                        {/* Cart */}
                        <a href="/cart" className="p-2 hover:bg-gray-100 rounded relative" aria-label={labels.cart}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}
