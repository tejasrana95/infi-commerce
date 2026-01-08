'use client';

import { useRouter } from 'next/navigation';

export default function HeroSliderEditorPage() {
    const router = useRouter();
    router.push(`/hero-sliders`);

    return null;
}
