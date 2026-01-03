'use client';

import { Layout } from '@/types/layout';
import SectionRenderer from '../SectionRenderer';

interface LayoutEngineProps {
    layout: Layout;
    moduleData?: Record<string, any>;
}

/**
 * LayoutEngine - Main component for rendering layouts
 * Processes layout data and renders sections in order
 * Accepts moduleData for SSR to pass pre-fetched data to modules
 */
export default function LayoutEngine({ layout, moduleData }: LayoutEngineProps) {
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
            {sortedSections.map((section, index) => (
                <SectionRenderer key={section.id} section={section} moduleData={moduleData} index={index} />
            ))}

            {/* Custom CSS */}
            {layout.settings?.customCSS && (
                <style dangerouslySetInnerHTML={{ __html: layout.settings.customCSS }} />
            )}
        </div>
    );
}

