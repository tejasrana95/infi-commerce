'use client';

import { Layout } from '@/types/layout';
import SectionRenderer from '../SectionRenderer';

interface LayoutEngineProps {
    layout: Layout;
}

/**
 * LayoutEngine - Main component for rendering layouts
 * Processes layout data and renders sections in order
 */
export default function LayoutEngine({ layout }: LayoutEngineProps) {
    if (!layout || !layout.sections || layout.sections.length === 0) {
        return null;
    }

    // Apply page-level settings
    const pageStyle: React.CSSProperties = {
        backgroundColor: layout.settings?.backgroundColor,
    };

    // Sort sections by order
    const sortedSections = [...layout.sections].sort((a, b) => (a.order || 0) - (b.order || 0));

    return (
        <div
            className={layout.settings?.bodyClass || ''}
            style={pageStyle}
        >
            {sortedSections.map((section) => (
                <SectionRenderer key={section.id} section={section} />
            ))}

            {/* Custom CSS */}
            {layout.settings?.customCSS && (
                <style dangerouslySetInnerHTML={{ __html: layout.settings.customCSS }} />
            )}
        </div>
    );
}
