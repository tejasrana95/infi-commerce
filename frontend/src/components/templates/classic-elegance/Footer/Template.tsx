// Classic Elegance Footer Template - Based on reference design
// Traditional layout with orange accents

import { FooterTemplateProps } from '@/components/templates/core/Footer/types';

export default function ClassicEleganceFooterTemplate({
    storeName,
    columns,
    socialLinks,
    contact,
    newsletter,
    copyrightText,
}: FooterTemplateProps) {
    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Column 1 - About Store */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-amber-500 inline-block">
                            {storeName}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed mb-4">
                            Your trusted destination for authentic handcrafted products. We bring you the finest
                            quality items curated with care and delivered with excellence.
                        </p>
                        <div className="flex gap-3 mt-4">
                            {socialLinks.map((social, index) => (
                                <a
                                    key={index}
                                    href={social.url}
                                    className="w-9 h-9 bg-gray-800 rounded hover:bg-amber-500 flex items-center justify-center transition-colors"
                                >
                                    <SocialIcon platform={social.platform} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2 - Quick Links */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-amber-500 inline-block">
                            Quick Links
                        </h3>
                        <ul className="space-y-2 text-sm">
                            {columns[0]?.links.slice(0, 6).map((link, index) => (
                                <li key={index}>
                                    <a href={link.url} className="hover:text-amber-500 transition-colors flex items-center gap-2">
                                        <span className="text-amber-500">›</span> {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3 - Customer Service */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-amber-500 inline-block">
                            Customer Service
                        </h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="/faq" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-amber-500">›</span> FAQ</a></li>
                            <li><a href="/shipping" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-amber-500">›</span> Shipping Policy</a></li>
                            <li><a href="/returns" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-amber-500">›</span> Return Policy</a></li>
                            <li><a href="/privacy" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-amber-500">›</span> Privacy Policy</a></li>
                            <li><a href="/terms" className="hover:text-amber-500 transition-colors flex items-center gap-2"><span className="text-amber-500">›</span> Terms & Conditions</a></li>
                        </ul>
                    </div>

                    {/* Column 4 - Contact & Newsletter */}
                    <div>
                        <h3 className="text-white text-lg font-bold mb-4 pb-2 border-b-2 border-amber-500 inline-block">
                            Contact Us
                        </h3>
                        <ul className="space-y-3 text-sm mb-6">
                            {contact.address && (
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500 mt-0.5">📍</span>
                                    <span>{contact.address}</span>
                                </li>
                            )}
                            {contact.phone && (
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">📞</span>
                                    <span>{contact.phone}</span>
                                </li>
                            )}
                            {contact.email && (
                                <li className="flex items-start gap-2">
                                    <span className="text-amber-500">✉️</span>
                                    <span>{contact.email}</span>
                                </li>
                            )}
                        </ul>

                        {/* Newsletter */}
                        {newsletter.enabled && (
                            <div>
                                <h4 className="text-white font-medium mb-2">{newsletter.title}</h4>
                                <form className="flex">
                                    <input
                                        type="email"
                                        placeholder={newsletter.placeholder}
                                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-amber-500"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-amber-500 text-white px-4 py-2 hover:bg-amber-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>{copyrightText}</p>
                        <div className="flex items-center gap-4">
                            <span>We Accept:</span>
                            <div className="flex gap-2">
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs">Visa</span>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs">Mastercard</span>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs">PayPal</span>
                                <span className="bg-gray-800 px-2 py-1 rounded text-xs">UPI</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

// Social Icon Helper
function SocialIcon({ platform }: { platform: string }) {
    const iconClass = "w-4 h-4 fill-current";

    switch (platform) {
        case 'facebook':
            return <svg className={iconClass} viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
        case 'instagram':
            return <svg className={iconClass} viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" /></svg>;
        case 'youtube':
            return <svg className={iconClass} viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>;
        case 'twitter':
            return <svg className={iconClass} viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>;
        default:
            return <span className="text-xs capitalize">{platform[0]}</span>;
    }
}
