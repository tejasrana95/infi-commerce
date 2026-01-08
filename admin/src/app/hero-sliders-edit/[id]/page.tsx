'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import heroSliderService, { HeroSlider } from '@/services/heroSlider.service';
import HeroSliderEditor from '@/components/organisms/HeroSliderEditor';

export default function HeroSliderEditorPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [slider, setSlider] = useState<HeroSlider | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSlider();
    }, [id]);

    const fetchSlider = async () => {
        try {
            setLoading(true);
            const response = await heroSliderService.getById(id);
            setSlider(response.data);
        } catch (error) {
            console.error('Failed to load slider', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!slider) {
        return <Typography>Slider not found</Typography>;
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <HeroSliderEditor
                initialData={slider}
                sliderName={slider.name}
                onBack={() => router.push('/hero-sliders')}
                onSave={async (updatedSlider) => {
                    await heroSliderService.update(id, updatedSlider);
                    setSlider({ ...slider, ...updatedSlider });
                }}
            />
        </Box>
    );
}
