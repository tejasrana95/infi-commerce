import React, { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, useMediaQuery, useTheme, Typography, Tooltip, alpha, Snackbar, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { HeroSlider, HeroSliderSlide, HeroSliderLayer } from '@/services/heroSlider.service';

import SliderSettingsDialog from './SliderSettingsDialog';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from './Toolbar';
import SlideList from './SlideList';
import LayerList from './LayerList';
import SlideCanvas from './SlideCanvas';
import LayerProperties from './LayerProperties';
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

interface HeroSliderEditorProps {
    initialData: HeroSlider;
    sliderName?: string;
    onBack?: () => void;
    onSave: (data: Partial<HeroSlider>) => void;
}

// Dark theme colors
const colors = {
    bg: '#0d0d1a',
    bgSecondary: '#13132a',
    bgTertiary: '#1a1a3a',
    border: '#2a2a4a',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.6)',
    accent: '#00d4ff',
    accent2: '#7c3aed',
    gradient: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
};

export default function HeroSliderEditor({ initialData, sliderName, onBack, onSave }: HeroSliderEditorProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    // State with undo/redo support
    const { state: slider, setState: setSlider, undo, redo, canUndo, canRedo } = useHistory<HeroSlider>(initialData);

    const [activeSlideId, setActiveSlideId] = useState<string>(initialData.slides[0]?.id || '');
    // Multi-select support
    const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    // Drawer states
    const [leftDrawerOpen, setLeftDrawerOpen] = useState(!isMobile);
    const [rightDrawerOpen, setRightDrawerOpen] = useState(!isMobile);

    // Grid and snapping settings
    const [showGrid, setShowGrid] = useState(false);
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Clipboard for copy/paste
    const [copiedLayer, setCopiedLayer] = useState<HeroSliderLayer | null>(null);
    const [copiedSlide, setCopiedSlide] = useState<HeroSliderSlide | null>(null);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // Auto-close drawers on mobile
    useEffect(() => {
        setLeftDrawerOpen(!isMobile);
        setRightDrawerOpen(!isMobile);
    }, [isMobile]);

    // Ensure we have an active slide if slides exist
    useEffect(() => {
        if (!activeSlideId && slider.slides.length > 0) {
            setActiveSlideId(slider.slides[0].id);
        }
    }, [slider.slides, activeSlideId]);

    const activeSlide = slider.slides.find(s => s.id === activeSlideId);
    const selectedLayers = activeSlide?.layers.filter(l => selectedLayerIds.includes(l.id)) || [];
    const selectedLayer = selectedLayers.length === 1 ? selectedLayers[0] : undefined;

    // Layer selection handler (supports multi-select with Ctrl/Cmd)
    const handleSelectLayer = useCallback((id: string, addToSelection: boolean = false) => {
        if (!id) {
            setSelectedLayerIds([]);
            return;
        }

        if (addToSelection) {
            setSelectedLayerIds(prev =>
                prev.includes(id)
                    ? prev.filter(lid => lid !== id)
                    : [...prev, id]
            );
        } else {
            setSelectedLayerIds([id]);
        }
    }, []);

    // Save handler with notification
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            await onSave(slider);
            setShowSaveSuccess(true);
        } catch (error) {
            console.error('Save failed:', error);
        } finally {
            setIsSaving(false);
        }
    }, [slider, onSave]);

    // -- Slide Actions --
    const handleAddSlide = useCallback(() => {
        const newSlide: HeroSliderSlide = {
            id: uuidv4(),
            background: { type: 'color', value: '#1a1a2e' },
            layers: [],
            settings: { duration: 5000 }
        };
        const updatedSlides = [...slider.slides, newSlide];
        setSlider({ ...slider, slides: updatedSlides });
        setActiveSlideId(newSlide.id);
    }, [slider, setSlider]);

    const handleDeleteSlide = useCallback((id: string) => {
        const updatedSlides = slider.slides.filter(s => s.id !== id);
        setSlider({ ...slider, slides: updatedSlides });
        if (activeSlideId === id) {
            setActiveSlideId(updatedSlides[0]?.id || '');
        }
    }, [slider, setSlider, activeSlideId]);

    const handleCopySlide = useCallback((id: string) => {
        const slide = slider.slides.find(s => s.id === id);
        if (slide) setCopiedSlide(slide);
    }, [slider.slides]);

    const handlePasteSlide = useCallback(() => {
        if (!copiedSlide) return;

        const newSlide: HeroSliderSlide = {
            ...copiedSlide,
            id: uuidv4(),
            _id: undefined,
            name: copiedSlide.name ? `${copiedSlide.name} (Copy)` : undefined,
            layers: copiedSlide.layers.map(layer => ({ ...layer, id: uuidv4() }))
        };

        setSlider({ ...slider, slides: [...slider.slides, newSlide] });
        setActiveSlideId(newSlide.id);
    }, [copiedSlide, slider, setSlider]);

    const handleUpdateSlide = useCallback((id: string, updates: Partial<HeroSliderSlide>) => {
        setSlider({
            ...slider,
            slides: slider.slides.map(s => s.id === id ? { ...s, ...updates } : s)
        });
    }, [slider, setSlider]);

    const handleReorderSlides = useCallback((slides: HeroSliderSlide[]) => {
        setSlider({ ...slider, slides });
    }, [slider, setSlider]);

    // -- Layer Actions --
    const handleAddLayer = useCallback((type: HeroSliderLayer['type']) => {
        if (!activeSlide) return;
        const newLayer: HeroSliderLayer = {
            id: uuidv4(),
            type,
            content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : type === 'icon' ? 'FaStar' : '',
            style: {
                fontSize: type === 'text' ? 32 : 18,
                fontWeight: type === 'text' ? '700' : '500',
                color: '#ffffff',
                backgroundColor: type === 'button' ? colors.accent : 'transparent',
                padding: type === 'button' ? '12px 28px' : 0,
                borderRadius: type === 'button' ? '8px' : 0
            },
            position: { x: 5, y: 5 },
            animation: { in: 'fadeIn', out: 'fadeOut', delay: 0, duration: 800 },
            visible: true,
            locked: false,
            rotation: 0,
            opacity: 1
        };
        handleUpdateSlide(activeSlide.id, { layers: [...activeSlide.layers, newLayer] });
        setSelectedLayerIds([newLayer.id]);
    }, [activeSlide, handleUpdateSlide]);

    const handleUpdateLayer = useCallback((layerId: string, updates: Partial<HeroSliderLayer>) => {
        if (!activeSlide) return;
        handleUpdateSlide(activeSlide.id, {
            layers: activeSlide.layers.map(l => l.id === layerId ? { ...l, ...updates } : l)
        });
    }, [activeSlide, handleUpdateSlide]);

    const handleDeleteLayer = useCallback((layerId: string) => {
        if (!activeSlide) return;
        handleUpdateSlide(activeSlide.id, { layers: activeSlide.layers.filter(l => l.id !== layerId) });
        setSelectedLayerIds(prev => prev.filter(id => id !== layerId));
    }, [activeSlide, handleUpdateSlide]);

    const handleDuplicateLayer = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (!layer) return;

        const newLayer: HeroSliderLayer = {
            ...layer,
            id: uuidv4(),
            name: layer.name ? `${layer.name} (Copy)` : undefined,
            position: { x: (layer.position?.x || 0) + 3, y: (layer.position?.y || 0) + 3 }
        };

        handleUpdateSlide(activeSlide.id, { layers: [...activeSlide.layers, newLayer] });
        setSelectedLayerIds([newLayer.id]);
    }, [activeSlide, handleUpdateSlide]);

    const handleToggleLayerVisibility = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (layer) handleUpdateLayer(layerId, { visible: layer.visible === false ? true : false });
    }, [activeSlide, handleUpdateLayer]);

    const handleToggleLayerLock = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (layer) handleUpdateLayer(layerId, { locked: !layer.locked });
    }, [activeSlide, handleUpdateLayer]);

    const handleReorderLayers = useCallback((layers: HeroSliderLayer[]) => {
        if (!activeSlide) return;
        handleUpdateSlide(activeSlideId, { layers });
    }, [activeSlide, activeSlideId, handleUpdateSlide]);

    // Copy/Paste Layer
    const handleCopyLayer = useCallback(() => {
        if (selectedLayer) setCopiedLayer(selectedLayer);
    }, [selectedLayer]);

    const handlePasteLayer = useCallback(() => {
        if (!copiedLayer || !activeSlide) return;

        const newLayer: HeroSliderLayer = {
            ...copiedLayer,
            id: uuidv4(),
            name: copiedLayer.name ? `${copiedLayer.name} (Copy)` : undefined,
            position: { x: (copiedLayer.position?.x || 0) + 3, y: (copiedLayer.position?.y || 0) + 3 }
        };

        handleUpdateSlide(activeSlide.id, { layers: [...activeSlide.layers, newLayer] });
        setSelectedLayerIds([newLayer.id]);
    }, [copiedLayer, activeSlide, handleUpdateSlide]);

    // Move layer with arrow keys
    const handleMoveLayer = useCallback((direction: 'up' | 'down' | 'left' | 'right', large: boolean = false) => {
        if (!selectedLayer || !activeSlide) return;

        const step = large ? 2 : 0.5; // Percentage movement
        let position = { ...selectedLayer.position };

        switch (direction) {
            case 'up': position.y = Math.max(0, position.y - step); break;
            case 'down': position.y = Math.min(100, position.y + step); break;
            case 'left': position.x = Math.max(0, position.x - step); break;
            case 'right': position.x = Math.min(100, position.x + step); break;
        }

        handleUpdateLayer(selectedLayer.id, { position });
    }, [selectedLayer, activeSlide, handleUpdateLayer]);

    // -- Alignment Actions (for multi-select) --
    const handleAlignLayers = useCallback((alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' | 'distributeH' | 'distributeV') => {
        if (!activeSlide || selectedLayers.length < 2) return;

        const container = document.getElementById('slide-canvas-container');
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        // Get accurate dimensions from DOM
        const layersWithRects = selectedLayers.map(l => {
            const el = document.getElementById(`layer-${l.id}`);
            const rect = el ? el.getBoundingClientRect() : {
                left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0
            };

            // Convert current DOM position back to percentages relative to container
            // We use this for calculation to be consistent with what user sees
            const x = ((rect.left - containerRect.left) / containerRect.width) * 100;
            const y = ((rect.top - containerRect.top) / containerRect.height) * 100;
            const w = (rect.width / containerRect.width) * 100;
            const h = (rect.height / containerRect.height) * 100;

            return {
                id: l.id,
                x, y, w, h,
                originalX: l.position?.x || 0,
                originalY: l.position?.y || 0
            };
        });

        let updates: { id: string; position: { x: number; y: number } }[] = [];

        switch (alignment) {
            case 'left': {
                const minX = Math.min(...layersWithRects.map(l => l.x));
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: minX, y: l.originalY } }));
                break;
            }
            case 'right': {
                // Align right edges: max(x + w) -> newX = maxRight - w
                const maxRight = Math.max(...layersWithRects.map(l => l.x + l.w));
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: maxRight - l.w, y: l.originalY } }));
                break;
            }
            case 'top': {
                const minY = Math.min(...layersWithRects.map(l => l.y));
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: l.originalX, y: minY } }));
                break;
            }
            case 'bottom': {
                // Align bottom edges: max(y + h) -> newY = maxBottom - h
                const maxBottom = Math.max(...layersWithRects.map(l => l.y + l.h));
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: l.originalX, y: maxBottom - l.h } }));
                break;
            }
            case 'centerH': {
                // Align centers vertically: average(centerPoints) -> newX = avgCenter - w/2
                // Center point = x + w/2
                const avgCenterX = layersWithRects.reduce((sum, l) => sum + (l.x + (l.w / 2)), 0) / layersWithRects.length;
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: avgCenterX - (l.w / 2), y: l.originalY } }));
                break;
            }
            case 'centerV': {
                // Align centers horizontally: average(centerPoints) -> newY = avgCenter - h/2
                const avgCenterY = layersWithRects.reduce((sum, l) => sum + (l.y + (l.h / 2)), 0) / layersWithRects.length;
                updates = layersWithRects.map(l => ({ id: l.id, position: { x: l.originalX, y: avgCenterY - (l.h / 2) } }));
                break;
            }
            case 'distributeH': {
                // Distribute centers evenly between minX and maxX
                // Or distribute spacing? Usually "Distribute Horizontal Centers" or "Distribute Spacing"
                // Standard UI tools often distribute centers if size varies, or spacing.
                // Let's implement distinct center distribution for now as it's safer for varying widths.

                const sorted = [...layersWithRects].sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));
                if (sorted.length < 3) return; // minimal 3 items to distribute

                // Range is from center of first to center of last
                const first = sorted[0];
                const last = sorted[sorted.length - 1];

                const startCenter = first.x + (first.w / 2);
                const endCenter = last.x + (last.w / 2);
                const totalDist = endCenter - startCenter;
                const step = totalDist / (sorted.length - 1);

                updates = sorted.map((l, i) => {
                    // Start + step * i gives target center
                    // targetX = targetCenter - w/2
                    const targetCenter = startCenter + (step * i);
                    return { id: l.id, position: { x: targetCenter - (l.w / 2), y: l.originalY } };
                });
                break;
            }
            case 'distributeV': {
                const sorted = [...layersWithRects].sort((a, b) => (a.y + a.h / 2) - (b.y + b.h / 2));
                if (sorted.length < 3) return;

                const first = sorted[0];
                const last = sorted[sorted.length - 1];

                const startCenter = first.y + (first.h / 2);
                const endCenter = last.y + (last.h / 2);
                const totalDist = endCenter - startCenter;
                const step = totalDist / (sorted.length - 1);

                updates = sorted.map((l, i) => {
                    const targetCenter = startCenter + (step * i);
                    return { id: l.id, position: { x: l.originalX, y: targetCenter - (l.h / 2) } };
                });
                break;
            }
        }

        // Apply all updates
        const updatedLayers = activeSlide.layers.map(l => {
            const update = updates.find(u => u.id === l.id);
            return update ? { ...l, position: update.position } : l;
        });

        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
    }, [activeSlide, selectedLayers, handleUpdateSlide]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        onCopy: handleCopyLayer,
        onPaste: handlePasteLayer,
        onDuplicate: () => selectedLayerIds.length === 1 && handleDuplicateLayer(selectedLayerIds[0]),
        onDelete: () => selectedLayerIds.forEach(id => handleDeleteLayer(id)),
        onUndo: undo,
        onRedo: redo,
        onSave: handleSave,
        onMoveUp: () => handleMoveLayer('up'),
        onMoveDown: () => handleMoveLayer('down'),
        onMoveLeft: () => handleMoveLayer('left'),
        onMoveRight: () => handleMoveLayer('right'),
        onMoveUpLarge: () => handleMoveLayer('up', true),
        onMoveDownLarge: () => handleMoveLayer('down', true),
        onMoveLeftLarge: () => handleMoveLayer('left', true),
        onMoveRightLarge: () => handleMoveLayer('right', true),
        onToggleGrid: () => setShowGrid(prev => !prev),
        onDeselect: () => setSelectedLayerIds([])
    });

    const drawerWidth = 280;
    const propertiesWidth = 320;

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: colors.bg,
            color: colors.text,
            overflow: 'hidden'
        }}>
            {/* Top Toolbar */}
            <Box sx={{
                px: 1.5,
                py: 1,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: colors.bgSecondary
            }}>
                <Toolbar
                    sliderName={sliderName}
                    onBack={onBack}
                    onAddSlide={handleAddSlide}
                    onSave={handleSave}
                    onAddLayer={handleAddLayer}
                    onOpenSettings={() => setSettingsOpen(true)}
                    activeSlide={!!activeSlide}
                    viewMode={viewMode}
                    onChangeViewMode={setViewMode}
                    onUndo={undo}
                    onRedo={redo}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    showGrid={showGrid}
                    onToggleGrid={() => setShowGrid(prev => !prev)}
                    snapToGrid={snapToGrid}
                    onToggleSnap={() => setSnapToGrid(prev => !prev)}
                    zoom={zoom}
                    onChangeZoom={setZoom}
                    onCopyLayer={selectedLayer ? handleCopyLayer : undefined}
                    onPasteLayer={copiedLayer ? handlePasteLayer : undefined}
                    onDeleteLayer={selectedLayerIds.length > 0 ? () => selectedLayerIds.forEach(id => handleDeleteLayer(id)) : undefined}
                    // Multi-select alignment props
                    selectedLayerCount={selectedLayerIds.length}
                    onAlignLayers={handleAlignLayers}
                    // Panel toggles
                    leftPanelOpen={leftDrawerOpen}
                    onToggleLeftPanel={() => setLeftDrawerOpen(prev => !prev)}
                    rightPanelOpen={rightDrawerOpen}
                    onToggleRightPanel={() => setRightDrawerOpen(prev => !prev)}
                    isSaving={isSaving}
                />
            </Box>

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left Sidebar */}
                <Box sx={{
                    width: leftDrawerOpen ? drawerWidth : 0,
                    minWidth: leftDrawerOpen ? drawerWidth : 0,
                    transition: 'width 0.3s ease, min-width 0.3s ease',
                    overflow: 'hidden',
                    borderRight: leftDrawerOpen ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: colors.bgSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 10
                }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: drawerWidth }}>
                        <SlideList
                            slides={slider.slides}
                            activeId={activeSlideId}
                            onSelect={setActiveSlideId}
                            onDelete={handleDeleteSlide}
                            onCopy={handleCopySlide}
                            onPaste={copiedSlide ? handlePasteSlide : undefined}
                            onReorder={handleReorderSlides}
                        />
                        <Box sx={{ borderTop: `1px solid ${colors.border}`, flex: 1 }}>
                            <LayerList
                                layers={activeSlide?.layers || []}
                                selectedIds={selectedLayerIds}
                                onSelect={handleSelectLayer}
                                onDelete={handleDeleteLayer}
                                onDuplicate={handleDuplicateLayer}
                                onToggleVisibility={handleToggleLayerVisibility}
                                onToggleLock={handleToggleLayerLock}
                                onReorder={handleReorderLayers}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Center: Canvas */}
                <Box sx={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {activeSlide ? (
                        <SlideCanvas
                            slide={activeSlide}
                            selectedLayerIds={selectedLayerIds}
                            onSelectLayer={handleSelectLayer}
                            onUpdateLayer={handleUpdateLayer}
                            onUpdateSlide={(updates) => handleUpdateSlide(activeSlide.id, updates)}
                            viewMode={viewMode}
                            settings={slider.settings}
                            showGrid={showGrid}
                            snapToGrid={snapToGrid}
                            zoom={zoom}
                        />
                    ) : (
                        <Box sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.bg,
                            color: colors.textSecondary
                        }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>No Slide Selected</Typography>
                            <Typography variant="body2">Create a new slide to get started</Typography>
                        </Box>
                    )}
                </Box>

                {/* Right Sidebar */}
                <Box sx={{
                    width: rightDrawerOpen ? propertiesWidth : 0,
                    minWidth: rightDrawerOpen ? propertiesWidth : 0,
                    transition: 'width 0.3s ease, min-width 0.3s ease',
                    overflow: 'hidden',
                    borderLeft: rightDrawerOpen ? `1px solid ${colors.border}` : 'none',
                    backgroundColor: colors.bgSecondary,
                    zIndex: 10
                }}>
                    <Box sx={{ minWidth: propertiesWidth, height: '100%', overflow: 'auto' }}>
                        <LayerProperties
                            layer={selectedLayer}
                            slide={activeSlide}
                            onUpdateLayer={handleUpdateLayer}
                            onUpdateSlide={(updates) => handleUpdateSlide(activeSlideId, updates)}
                        />
                    </Box>
                </Box>
            </Box>

            <SliderSettingsDialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                settings={slider.settings}
                onSave={(newSettings) => setSlider({ ...slider, settings: newSettings })}
            />

            {/* Save Success Notification */}
            <Snackbar
                open={showSaveSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSaveSuccess(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setShowSaveSuccess(false)} severity="success" variant="filled">
                    Slider saved successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
}
