// Layout Engine - Main renderer for entire page layouts

import { Layout } from '@/types/layout';
import SectionRenderer from '../SectionRenderer';

interface LayoutEngineProps {
    layout: Layout | null;
}

export default function LayoutEngine({ layout }: LayoutEngineProps) {
    if (!layout || !layout.sections || layout.sections.length === 0) {
        // Fallback for empty layout
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <p>No content available</p>
            </div>
        );
    }

    // Sort sections by order
    const sortedSections = [...layout.sections].sort((a, b) => a.order - b.order);

    return (
        <>
            {sortedSections.map(section => (
                <SectionRenderer key={section.id} section={section} />
            ))}
        </>
    );
}
