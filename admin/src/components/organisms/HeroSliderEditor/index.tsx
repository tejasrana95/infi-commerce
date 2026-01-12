import React, { useState, useEffect, useCallback } from 'react';
import { Box, useMediaQuery, useTheme, Typography, Snackbar, Alert } from '@mui/material';
import { HeroSlider, HeroSliderSlide, HeroSliderLayer } from '@/services/heroSlider.service';

import SliderSettingsDialog from './SliderSettingsDialog';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from './Toolbar';
import SlideList from './SlideList';
import LayerList from './LayerList';
import SlideCanvas, { getPositionForViewport, getStyleForViewport, getVisibilityForViewport } from './SlideCanvas';
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

    // Layer selection handler (supports multi-select with Ctrl/Cmd and groups)
    const handleSelectLayer = useCallback((id: string, addToSelection: boolean = false) => {
        if (!id) {
            setSelectedLayerIds([]);
            return;
        }

        // Check if clicked layer is in a group
        const clickedLayer = activeSlide?.layers.find(l => l.id === id);
        const groupId = clickedLayer?.groupId;

        if (addToSelection) {
            setSelectedLayerIds(prev =>
                prev.includes(id)
                    ? prev.filter(lid => lid !== id)
                    : [...prev, id]
            );
        } else if (groupId) {
            // If layer is grouped, select all layers in the group
            const groupLayerIds = activeSlide?.layers
                .filter(l => l.groupId === groupId)
                .map(l => l.id) || [];
            setSelectedLayerIds(groupLayerIds);
        } else {
            setSelectedLayerIds([id]);
        }
    }, [activeSlide?.layers]);

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

        // Create a mapping of old IDs to new IDs for all layers in the slide
        const idMapping = new Map<string, string>();
        copiedSlide.layers.forEach(layer => {
            idMapping.set(layer.id, uuidv4());
        });

        const newSlide: HeroSliderSlide = {
            ...copiedSlide,
            id: uuidv4(),
            _id: undefined,
            name: copiedSlide.name ? `${copiedSlide.name} (Copy)` : undefined,
            layers: copiedSlide.layers.map(layer => ({
                ...layer,
                id: idMapping.get(layer.id)!,
                // Update parentId - if the parent is within the same slide, use its new ID
                parentId: layer.parentId ? (idMapping.get(layer.parentId) || layer.parentId) : undefined,
                // Update children references to use the new IDs
                children: layer.children?.map(childId => idMapping.get(childId) || childId)
            }))
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
    const handleAddLayer = useCallback((typeOrConfig: HeroSliderLayer['type'] | { type: 'section'; columns: number }) => {
        if (!activeSlide) return;

        // Handle section layer with column config
        if (typeof typeOrConfig === 'object' && typeOrConfig.type === 'section') {
            const { columns } = typeOrConfig;
            const newLayer: HeroSliderLayer = {
                id: uuidv4(),
                type: 'section',
                content: '',
                style: {
                    width: '90%',
                    minHeight: 200,
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 8
                },
                position: { x: 5, y: 10 },
                animation: { in: 'fadeIn', out: 'fadeOut', delay: 0, duration: 800 },
                visible: true,
                locked: false,
                rotation: 0,
                opacity: 1,
                children: [],
                sectionLayout: {
                    columns,
                    gap: 16,
                    alignment: 'stretch',
                    justify: 'start',
                    wrap: true,
                    direction: columns === 1 ? 'column' : 'row',
                    padding: { top: 16, right: 16, bottom: 16, left: 16 },
                    tabletColumns: Math.min(columns, 2),
                    mobileColumns: 1
                }
            };
            handleUpdateSlide(activeSlide.id, { layers: [...activeSlide.layers, newLayer] });
            setSelectedLayerIds([newLayer.id]);
            return;
        }

        // Regular layer types
        const type = typeOrConfig as HeroSliderLayer['type'];
        const newLayer: HeroSliderLayer = {
            id: uuidv4(),
            type,
            content: type === 'text' ? 'New Text' : type === 'button' ? 'Click Me' : type === 'icon' ? 'FaStar' : type === 'rte' ? '<h2>Rich Text</h2><p>Double click to edit</p>' : '',
            style: {
                fontSize: type === 'text' ? 32 : 18,
                fontWeight: type === 'text' ? '700' : '500',
                color: '#ffffff',
                backgroundColor: type === 'button' ? colors.accent : 'transparent',
                padding: type === 'button' ? '12px 28px' : 0,
                borderRadius: type === 'button' ? '8px' : 0,
                textAlign: type === 'text' || type === 'rte' ? 'left' : undefined
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

    // Batch update multiple layers at once (for synchronized multi-drag)
    const handleBatchUpdateLayers = useCallback((updates: Array<{ id: string; updates: Partial<HeroSliderLayer> }>) => {
        if (!activeSlide) return;
        const updatedLayers = activeSlide.layers.map(layer => {
            const update = updates.find(u => u.id === layer.id);
            return update ? { ...layer, ...update.updates } : layer;
        });
        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
    }, [activeSlide, handleUpdateSlide]);

    const handleDeleteLayer = useCallback((layerId: string) => {
        if (!activeSlide) return;

        // Find the layer to delete
        const layerToDelete = activeSlide.layers.find(l => l.id === layerId);
        if (!layerToDelete) return;

        // Recursively collect all descendant IDs using parentId (more reliable than children array)
        const collectAllDescendantIds = (id: string): string[] => {
            const ids = [id];
            // Find all layers that have this layer as their parent
            const children = activeSlide.layers.filter(l => l.parentId === id);
            for (const child of children) {
                ids.push(...collectAllDescendantIds(child.id));
            }
            return ids;
        };

        const idsToDelete = collectAllDescendantIds(layerId);

        // Remove deleted layers and update parent's children array
        const updatedLayers = activeSlide.layers
            .filter(l => !idsToDelete.includes(l.id))
            .map(l => {
                // Update children array if this section had any deleted children
                if (l.type === 'section' && l.children?.some(id => idsToDelete.includes(id))) {
                    return { ...l, children: l.children.filter(id => !idsToDelete.includes(id)) };
                }
                return l;
            });

        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
        setSelectedLayerIds(prev => prev.filter(id => !idsToDelete.includes(id)));
    }, [activeSlide, handleUpdateSlide]);

    // Add a layer to a section as a child
    const handleAddLayerToSection = useCallback((sectionId: string, type: 'text' | 'image' | 'button' | 'icon' | 'rte' | 'section') => {
        if (!activeSlide) return;

        const section = activeSlide.layers.find(l => l.id === sectionId && l.type === 'section');
        if (!section) return;

        // Get default content based on type
        const getDefaultContent = () => {
            switch (type) {
                case 'text': return 'New Text';
                case 'button': return 'Click Me';
                case 'icon': return 'FaStar';
                case 'rte': return '<p>Rich Text</p>';
                default: return '';
            }
        };

        // Get default style based on type
        const getDefaultStyle = () => {
            const baseStyle: Record<string, any> = {
                fontSize: type === 'text' ? 24 : 16,
                fontWeight: type === 'text' ? '600' : '400',
                color: '#ffffff',
                backgroundColor: type === 'button' ? colors.accent : type === 'section' ? 'rgba(255,255,255,0.05)' : 'transparent',
                padding: type === 'button' ? '10px 20px' : type === 'image' ? 0 : type === 'section' ? '16px' : '8px',
                borderRadius: type === 'button' ? '6px' : 0,
                width: '100%',
                height: type === 'image' ? 150 : 'auto'
            };
            return baseStyle;
        };

        const newLayer: HeroSliderLayer = {
            id: uuidv4(),
            type,
            parentId: sectionId,
            content: getDefaultContent(),
            style: getDefaultStyle(),
            position: { x: 0, y: 0 }, // Position handled by section grid
            animation: { in: 'fadeIn', out: 'fadeOut', delay: 0, duration: 500 },
            visible: true,
            locked: false,
            rotation: 0,
            opacity: 1,
            // Add section-specific properties for nested sections
            ...(type === 'section' && {
                children: [],
                sectionLayout: {
                    columns: 2,
                    gap: 16,
                    alignment: 'stretch' as const,
                    justify: 'start' as const,
                    wrap: true,
                    direction: 'row' as const
                }
            })
        };

        // Update section's children array and add the new layer
        const updatedLayers = activeSlide.layers.map(l => {
            if (l.id === sectionId) {
                return { ...l, children: [...(l.children || []), newLayer.id] };
            }
            return l;
        });

        handleUpdateSlide(activeSlide.id, { layers: [...updatedLayers, newLayer] });
        setSelectedLayerIds([newLayer.id]);
    }, [activeSlide, handleUpdateSlide]);

    const handleDuplicateLayer = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (!layer) return;

        // Map old IDs to new IDs for sections with children
        const idMapping = new Map<string, string>();

        // Recursively collect all layers to duplicate using parentId (for sections)
        const collectLayersToDuplicate = (id: string): HeroSliderLayer[] => {
            const l = activeSlide.layers.find(layer => layer.id === id);
            if (!l) return [];

            const layers = [l];
            // Find children by parentId relationship
            const children = activeSlide.layers.filter(layer => layer.parentId === id);
            for (const child of children) {
                layers.push(...collectLayersToDuplicate(child.id));
            }
            return layers;
        };

        const layersToDuplicate = collectLayersToDuplicate(layerId);

        // Generate new IDs for all layers being duplicated
        layersToDuplicate.forEach(l => {
            idMapping.set(l.id, uuidv4());
        });

        // Create duplicated layers with updated IDs and references
        const newLayers = layersToDuplicate.map((l, index) => {
            const newId = idMapping.get(l.id)!;
            const isRoot = index === 0; // First layer is the root being duplicated

            const duplicated: HeroSliderLayer = {
                ...l,
                id: newId,
                name: isRoot && l.name ? `${l.name} (Copy)` : l.name,
                // Offset position only for root layer (if it's a root-level layer)
                position: isRoot && !l.parentId
                    ? { x: (l.position?.x || 0) + 3, y: (l.position?.y || 0) + 3 }
                    : l.position,
                // Update parentId - if parent is being duplicated use new ID, otherwise keep original parentId
                parentId: l.parentId
                    ? (idMapping.get(l.parentId) || l.parentId)
                    : undefined,
                // Update children references to new IDs
                children: l.children?.map(childId => idMapping.get(childId) || childId)
            };

            return duplicated;
        });

        // If the duplicated layer has a parent (is inside a section), update that parent's children array
        let updatedLayers = [...activeSlide.layers];
        if (layer.parentId) {
            updatedLayers = updatedLayers.map(l => {
                if (l.id === layer.parentId && l.type === 'section') {
                    return { ...l, children: [...(l.children || []), newLayers[0].id] };
                }
                return l;
            });
        }

        handleUpdateSlide(activeSlide.id, { layers: [...updatedLayers, ...newLayers] });
        setSelectedLayerIds([newLayers[0].id]);
    }, [activeSlide, handleUpdateSlide]);

    const handleToggleLayerVisibility = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (!layer) return;

        // Get current visibility for the active viewport
        const currentVisibility = getVisibilityForViewport(layer, viewMode);
        const newVisibility = !currentVisibility;

        // Update the viewport-specific visibility property
        if (viewMode === 'mobile') {
            handleUpdateLayer(layerId, { mobileVisible: newVisibility });
        } else if (viewMode === 'tablet') {
            handleUpdateLayer(layerId, { tabletVisible: newVisibility });
        } else {
            handleUpdateLayer(layerId, { visible: newVisibility });
        }
    }, [activeSlide, handleUpdateLayer, viewMode]);

    const handleToggleLayerLock = useCallback((layerId: string) => {
        if (!activeSlide) return;
        const layer = activeSlide.layers.find(l => l.id === layerId);
        if (layer) handleUpdateLayer(layerId, { locked: !layer.locked });
    }, [activeSlide, handleUpdateLayer]);

    const handleReorderLayers = useCallback((layers: HeroSliderLayer[]) => {
        if (!activeSlide) return;
        handleUpdateSlide(activeSlideId, { layers });
    }, [activeSlide, activeSlideId, handleUpdateSlide]);

    // Copy/Paste Layer - for sections, also copy children
    const handleCopyLayer = useCallback(() => {
        if (!selectedLayer || !activeSlide) return;

        // For sections, collect all children recursively
        if (selectedLayer.type === 'section' && selectedLayer.children?.length) {
            const collectLayersToCopy = (id: string): HeroSliderLayer[] => {
                const l = activeSlide.layers.find(layer => layer.id === id);
                if (!l) return [];

                const layers = [l];
                if (l.type === 'section' && l.children?.length) {
                    for (const childId of l.children) {
                        layers.push(...collectLayersToCopy(childId));
                    }
                }
                return layers;
            };
            // Store all layers as an array in copiedLayer (we'll handle it specially)
            setCopiedLayer({ ...selectedLayer, _copiedChildren: collectLayersToCopy(selectedLayer.id) } as any);
        } else {
            setCopiedLayer(selectedLayer);
        }
    }, [selectedLayer, activeSlide]);

    const handlePasteLayer = useCallback(() => {
        if (!copiedLayer || !activeSlide) return;

        // Check if this is a section with copied children
        const copiedChildren = (copiedLayer as any)._copiedChildren as HeroSliderLayer[] | undefined;
        const originalParentId = copiedLayer.parentId;

        if (copiedChildren && copiedChildren.length > 0) {
            // Map old IDs to new IDs
            const idMapping = new Map<string, string>();
            copiedChildren.forEach(l => {
                idMapping.set(l.id, uuidv4());
            });

            // Create duplicated layers with updated IDs and references
            const newLayers = copiedChildren.map((l, index) => {
                const newId = idMapping.get(l.id)!;
                const isRoot = index === 0;

                const duplicated: HeroSliderLayer = {
                    ...l,
                    id: newId,
                    name: isRoot && l.name ? `${l.name} (Copy)` : l.name,
                    position: isRoot && !l.parentId
                        ? { x: (l.position?.x || 0) + 3, y: (l.position?.y || 0) + 3 }
                        : l.position,
                    // Keep original parentId for root layer, map for nested children
                    parentId: l.parentId
                        ? (idMapping.get(l.parentId) || l.parentId)
                        : undefined,
                    children: l.children?.map(childId => idMapping.get(childId) || childId)
                };

                // Remove internal property
                delete (duplicated as any)._copiedChildren;

                return duplicated;
            });

            // If pasted layer has a parent, update parent's children array
            let updatedLayers = [...activeSlide.layers];
            if (originalParentId) {
                updatedLayers = updatedLayers.map(l => {
                    if (l.id === originalParentId && l.type === 'section') {
                        return { ...l, children: [...(l.children || []), newLayers[0].id] };
                    }
                    return l;
                });
            }

            handleUpdateSlide(activeSlide.id, { layers: [...updatedLayers, ...newLayers] });
            setSelectedLayerIds([newLayers[0].id]);
        } else {
            // Simple layer paste - keep it at same level
            const newLayer: HeroSliderLayer = {
                ...copiedLayer,
                id: uuidv4(),
                name: copiedLayer.name ? `${copiedLayer.name} (Copy)` : undefined,
                position: !copiedLayer.parentId
                    ? { x: (copiedLayer.position?.x || 0) + 3, y: (copiedLayer.position?.y || 0) + 3 }
                    : copiedLayer.position,
                parentId: copiedLayer.parentId // Keep the same parent
            };

            // Remove internal property if exists
            delete (newLayer as any)._copiedChildren;

            // If pasted layer has a parent, update parent's children array
            let updatedLayers = [...activeSlide.layers];
            if (copiedLayer.parentId) {
                updatedLayers = updatedLayers.map(l => {
                    if (l.id === copiedLayer.parentId && l.type === 'section') {
                        return { ...l, children: [...(l.children || []), newLayer.id] };
                    }
                    return l;
                });
            }

            handleUpdateSlide(activeSlide.id, { layers: [...updatedLayers, newLayer] });
            setSelectedLayerIds([newLayer.id]);
        }
    }, [copiedLayer, activeSlide, handleUpdateSlide]);

    // Group selected layers
    const handleGroupLayers = useCallback(() => {
        if (!activeSlide || selectedLayerIds.length < 2) return;
        const groupId = uuidv4();
        const updatedLayers = activeSlide.layers.map(layer =>
            selectedLayerIds.includes(layer.id) ? { ...layer, groupId } : layer
        );
        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
    }, [activeSlide, selectedLayerIds, handleUpdateSlide]);

    // Ungroup selected layers
    const handleUngroupLayers = useCallback(() => {
        if (!activeSlide || selectedLayerIds.length === 0) return;
        const updatedLayers = activeSlide.layers.map(layer =>
            selectedLayerIds.includes(layer.id) ? { ...layer, groupId: undefined } : layer
        );
        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
    }, [activeSlide, selectedLayerIds, handleUpdateSlide]);

    // Move layers with arrow keys (supports multi-select and viewMode)
    const handleMoveLayer = useCallback((direction: 'up' | 'down' | 'left' | 'right', large: boolean = false) => {
        if (selectedLayers.length === 0 || !activeSlide) return;

        const step = large ? 2 : 0.5; // Percentage movement

        // Build batch updates for all selected layers
        const batchUpdates: Array<{ id: string; updates: Partial<HeroSliderLayer> }> = [];

        // Determine target property based on viewMode
        const positionProp = viewMode === 'mobile' ? 'mobilePosition' : viewMode === 'tablet' ? 'tabletPosition' : 'position';

        selectedLayers.forEach(layer => {
            if (layer.locked) return;

            // Get the current position for this viewport using the helper
            const currentPos = getPositionForViewport(layer, viewMode);
            const newPos = { ...currentPos };

            switch (direction) {
                case 'up': newPos.y = Math.max(0, currentPos.y - step); break;
                case 'down': newPos.y = Math.min(100, currentPos.y + step); break;
                case 'left': newPos.x = Math.max(0, currentPos.x - step); break;
                case 'right': newPos.x = Math.min(100, currentPos.x + step); break;
            }

            batchUpdates.push({ id: layer.id, updates: { [positionProp]: newPos } });
        });

        if (batchUpdates.length > 1) {
            handleBatchUpdateLayers(batchUpdates);
        } else if (batchUpdates.length === 1) {
            handleUpdateLayer(batchUpdates[0].id, batchUpdates[0].updates);
        }
    }, [selectedLayers, activeSlide, handleUpdateLayer, handleBatchUpdateLayers, viewMode]);

    // -- Alignment Actions (for multi-select) --
    // Fixed to properly calculate based on viewport-specific positions and dimensions
    const handleAlignLayers = useCallback((alignment: 'left' | 'right' | 'top' | 'bottom' | 'centerH' | 'centerV' | 'distributeH' | 'distributeV') => {
        if (!activeSlide || selectedLayers.length === 0) return;

        // If only 1 layer selected and trying to distribute, do nothing
        if (selectedLayers.length < 2 && (alignment === 'distributeH' || alignment === 'distributeV')) return;

        // Get canvas container for dimension reference
        const container = document.getElementById('slide-canvas-container');
        if (!container) return;

        // Get the actual canvas dimensions from data attributes (set by SlideCanvas)
        const canvasWidth = parseFloat(container.dataset.canvasWidth || '0');
        const canvasHeight = parseFloat(container.dataset.canvasHeight || '0');

        if (!canvasWidth || !canvasHeight) return;

        // Target property based on viewMode
        const targetProp = viewMode === 'mobile' ? 'mobilePosition' : viewMode === 'tablet' ? 'tabletPosition' : 'position';

        // Calculate layer positions and dimensions based on viewport-specific data
        // NOT from DOM rects which can be affected by zoom and scaling
        const layersWithRects = selectedLayers.map(layer => {
            // Get the position for the current viewport using our helper
            const pos = getPositionForViewport(layer, viewMode);
            const style = getStyleForViewport(layer, viewMode);

            // Get width/height from style or DOM as fallback
            const el = document.getElementById(`layer-${layer.id}`);
            const rect = el?.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // Calculate width/height as percentage of container
            let widthPercent = 0;
            let heightPercent = 0;

            if (style?.width && typeof style.width === 'number') {
                widthPercent = (style.width / canvasWidth) * 100;
            } else if (rect && containerRect.width) {
                widthPercent = (rect.width / containerRect.width) * 100;
            }

            if (style?.height && typeof style.height === 'number') {
                heightPercent = (style.height / canvasHeight) * 100;
            } else if (rect && containerRect.height) {
                heightPercent = (rect.height / containerRect.height) * 100;
            }

            return {
                id: layer.id,
                x: pos.x,
                y: pos.y,
                w: widthPercent,
                h: heightPercent
            };
        });

        let updates: { id: string; newPoint: { x: number; y: number } }[] = [];
        const isSingle = selectedLayers.length === 1;

        switch (alignment) {
            case 'left': {
                // Align to left edge (0%) or to the leftmost layer
                const targetX = isSingle ? 0 : Math.min(...layersWithRects.map(l => l.x));
                updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: targetX, y: l.y } }));
                break;
            }
            case 'right': {
                if (isSingle) {
                    // Align to right edge (100% - width)
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: Math.max(0, 100 - l.w), y: l.y } }));
                } else {
                    // Align to rightmost layer's right edge
                    const maxRight = Math.max(...layersWithRects.map(l => l.x + l.w));
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: Math.max(0, maxRight - l.w), y: l.y } }));
                }
                break;
            }
            case 'top': {
                // Align to top (0%) or to the topmost layer
                const targetY = isSingle ? 0 : Math.min(...layersWithRects.map(l => l.y));
                updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: l.x, y: targetY } }));
                break;
            }
            case 'bottom': {
                if (isSingle) {
                    // Align to bottom (100% - height)
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: l.x, y: Math.max(0, 100 - l.h) } }));
                } else {
                    // Align to bottommost layer's bottom edge
                    const maxBottom = Math.max(...layersWithRects.map(l => l.y + l.h));
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: l.x, y: Math.max(0, maxBottom - l.h) } }));
                }
                break;
            }
            case 'centerH': {
                if (isSingle) {
                    // Center horizontally in container
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: Math.max(0, 50 - (l.w / 2)), y: l.y } }));
                } else {
                    // Align to average center of selected layers
                    const avgCenterX = layersWithRects.reduce((sum, l) => sum + (l.x + (l.w / 2)), 0) / layersWithRects.length;
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: Math.max(0, avgCenterX - (l.w / 2)), y: l.y } }));
                }
                break;
            }
            case 'centerV': {
                if (isSingle) {
                    // Center vertically in container
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: l.x, y: Math.max(0, 50 - (l.h / 2)) } }));
                } else {
                    // Align to average center of selected layers
                    const avgCenterY = layersWithRects.reduce((sum, l) => sum + (l.y + (l.h / 2)), 0) / layersWithRects.length;
                    updates = layersWithRects.map(l => ({ id: l.id, newPoint: { x: l.x, y: Math.max(0, avgCenterY - (l.h / 2)) } }));
                }
                break;
            }
            case 'distributeH': {
                const sorted = [...layersWithRects].sort((a, b) => (a.x + a.w / 2) - (b.x + b.w / 2));
                if (sorted.length < 3) return;

                const first = sorted[0];
                const last = sorted[sorted.length - 1];
                const startCenter = first.x + (first.w / 2);
                const endCenter = last.x + (last.w / 2);
                const totalDist = endCenter - startCenter;
                const step = totalDist / (sorted.length - 1);

                updates = sorted.map((l, i) => {
                    const targetCenter = startCenter + (step * i);
                    return { id: l.id, newPoint: { x: Math.max(0, targetCenter - (l.w / 2)), y: l.y } };
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
                    return { id: l.id, newPoint: { x: l.x, y: Math.max(0, targetCenter - (l.h / 2)) } };
                });
                break;
            }
        }

        // Apply all updates to the correct viewport position property
        const updatedLayers = activeSlide.layers.map(l => {
            const update = updates.find(u => u.id === l.id);
            return update ? { ...l, [targetProp]: update.newPoint } : l;
        });

        handleUpdateSlide(activeSlide.id, { layers: updatedLayers });
    }, [activeSlide, selectedLayers, handleUpdateSlide, viewMode]);

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
                    // Grouping props
                    onGroupLayers={handleGroupLayers}
                    onUngroupLayers={handleUngroupLayers}
                    hasGroupedSelection={selectedLayers.some(l => l.groupId)}
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
                        <Box sx={{ borderTop: `1px solid ${colors.border}`, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <LayerList
                                layers={activeSlide?.layers || []}
                                selectedIds={selectedLayerIds}
                                onSelect={handleSelectLayer}
                                onDelete={handleDeleteLayer}
                                onDuplicate={handleDuplicateLayer}
                                onToggleVisibility={handleToggleLayerVisibility}
                                onToggleLock={handleToggleLayerLock}
                                onReorder={handleReorderLayers}
                                onAddToSection={handleAddLayerToSection}
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
                            onBatchUpdateLayers={handleBatchUpdateLayers}
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
                            viewMode={viewMode}
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
