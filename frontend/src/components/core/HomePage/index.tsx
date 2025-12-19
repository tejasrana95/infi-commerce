// HomePage Container - Core business logic

import { Layout } from '@/types/layout';
import { getComponent } from '@/components/templates/registry';

interface HomePageProps {
    layout: Layout | null;
    store?: any;
    templateId: string;
}

export default function HomePage({ layout, store, templateId }: HomePageProps) {
    // Get template-specific HomePage template (not container, to avoid circular reference)
    const HomePageTemplate = getComponent('HomePageTemplate', templateId);

    // Pass data to template
    return (
        <HomePageTemplate
            layout={layout}
            store={store}
            templateId={templateId}
        />
    );
}
