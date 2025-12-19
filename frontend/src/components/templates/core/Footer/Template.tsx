// Core Footer Template - Default/Fallback presentation
// Pure UI component - receives processed data, renders UI

import { FooterTemplateProps } from './types';

export default function CoreFooterTemplate({
    storeName,
    columns,
    socialLinks,
    contact,
    newsletter,
    copyrightText,
    backgroundColor,
    textColor,
    currentYear,
}: FooterTemplateProps) {
    return (
        <footer
            className="border-t border-gray-200"
            style={{
                backgroundColor: backgroundColor || '#f9fafb',
                color: textColor || '#374151',
            }}
        >
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Column 1 - About */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">{storeName}</h3>
                        <p className="text-sm text-gray-600">
                            Your trusted online store for quality products and exceptional service.
                        </p>
                    </div>

                    {/* Dynamic Columns */}
                    {columns.map((column, index) => (
                        <div key={index}>
                            <h3 className="font-bold text-lg mb-4">{column.title}</h3>
                            <ul className="space-y-2 text-sm">
                                {column.links.map((link, linkIndex) => (
                                    <li key={linkIndex}>
                                        <a href={link.url} className="hover:underline">
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {/* Contact Column */}
                    <div>
                        <h3 className="font-bold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-2 text-sm">
                            {contact.email && <li>Email: {contact.email}</li>}
                            {contact.phone && <li>Phone: {contact.phone}</li>}
                            {contact.address && <li>Address: {contact.address}</li>}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-200 py-4">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
                    <p>{copyrightText}</p>
                    <div className="flex gap-4 mt-2 md:mt-0">
                        {socialLinks.map((social, index) => (
                            <a key={index} href={social.url} className="hover:text-gray-900 capitalize">
                                {social.platform}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
