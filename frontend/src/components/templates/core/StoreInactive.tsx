import Image from 'next/image';
import React from 'react';

export default function StoreInactive() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[100vh] px-4 text-center bg-gray-50">
            <div className="bg-white p-10 rounded-2xl max-w-lg shadow-sm border border-gray-100">
                <div className="w-30 h-30 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">

                    <Image src="/logo.webp" alt="Infi Commerce" width={100} height={52} />
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                    Website Currently Unavailable
                </h1>

                <p className="text-gray-600 mb-8 leading-relaxed">
                    This website is currently set to disabled or inactive status.
                    <br className="hidden sm:block" />
                    Please try again later.
                </p>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                    <p className="font-medium mb-1">Are you the store admin?</p>
                    <p>Please check your admin panel settings to re-enable the store.</p>
                </div>
            </div>

            <div className="mt-8 text-xs text-gray-400">
                &copy; {new Date().getFullYear()} Powered by <a href="https://www.infitechnology.com" target="_blank" rel="noopener noreferrer">Infi Commerce by Infi Technology</a>
            </div>
        </div>
    );
}
