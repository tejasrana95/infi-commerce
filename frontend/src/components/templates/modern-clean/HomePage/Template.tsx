// Modern Clean HomePage Template

import { Layout } from '@/types/layout';
import LayoutEngine from '@/components/core/layout/LayoutEngine';

interface ModernCleanHomePageProps {
    layout: Layout | null;
    store?: any;
    templateId: string;
}

export default function ModernCleanHomePageTemplate({
    layout,
    store
}: ModernCleanHomePageProps) {

    if (!layout) {
        // Fallback when no layout is configured
        return (
            <div className="py-20 text-center bg-gradient-to-b from-gray-50 to-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            Welcome to {store?.name || "Our Store"}
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            Your homepage is ready to be designed!
                        </p>

                        {process.env.NODE_ENV === "development" && (
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
                                <div className="flex items-start gap-4">
                                    <div className="text-3xl">🎨</div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-yellow-900 mb-2">Development Mode</h3>
                                        <p className="text-sm text-yellow-800 mb-3">
                                            No homepage layout found. Create one to get started!
                                        </p>
                                        <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                                            <li>Go to <strong>Admin Panel → Layouts</strong></li>
                                            <li>Click <strong>"Create New Layout"</strong></li>
                                            <li>Select type: <strong>"Homepage"</strong></li>
                                            <li>Drag & drop modules to build your page</li>
                                            <li>Set as <strong>default</strong> and publish</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Render layout using LayoutEngine
    return <LayoutEngine layout={layout} />;
}
