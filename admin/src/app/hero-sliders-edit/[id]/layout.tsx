import ProtectedRoute from '@/components/ProtectedRoute';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Hero Slider Editor | Admin',
    description: 'Manage hero slider editor configuration',
};


export default function HeroSliderEditorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute>
            {/* Full-screen layout without navigation sidebar */}
            <div style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                backgroundColor: '#0d0d1a'
            }}>
                {children}
            </div>
        </ProtectedRoute>
    );
}
