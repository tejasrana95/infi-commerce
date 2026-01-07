import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { DndContext, useDraggable, DragEndEvent, DragStartEvent, DragMoveEvent, useSensor, useSensors, PointerSensor, Modifier, ClientRect } from '@dnd-kit/core';
import { HeroSliderSlide, HeroSliderLayer } from '@/services/heroSlider.service';

import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BiIcons from 'react-icons/bi';
import * as IoIcons from 'react-icons/io5';
import * as LucideIcons from 'lucide-react';

interface SlideCanvasProps {
    slide: HeroSliderSlide;
    selectedLayerIds: string[];
    onSelectLayer: (id: string, addToSelection?: boolean) => void;
    onUpdateLayer: (id: string, updates: Partial<HeroSliderLayer>) => void;
    onUpdateSlide: (updates: Partial<HeroSliderSlide>) => void;
    viewMode: string;
    settings: any;
    showGrid?: boolean;
    snapToGrid?: boolean;
    zoom?: number;
}

const renderIcon = (iconName: string, fontSize: any) => {
    try {
        const size = parseInt(fontSize) || 24;
        if (iconName.startsWith('Fa')) {
            const Icon = (FaIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Md')) {
            const Icon = (MdIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Bi')) {
            const Icon = (BiIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        if (iconName.startsWith('Io')) {
            const Icon = (IoIcons as any)[iconName];
            return Icon ? <Icon size={size} /> : null;
        }
        const Icon = (LucideIcons as any)[iconName];
        return Icon ? <Icon size={size} /> : null;
    } catch (e) {
        return null;
    }
};

// Draggable Layer Component
const DraggableLayer = ({
    layer,
    isSelected,
    onSelect,
    viewMode,
    containerWidth,
    containerHeight
}: {
    layer: HeroSliderLayer;
    id?: string;
    isSelected: boolean;
    onSelect: (addToSelection?: boolean) => void;
    viewMode: string;
    containerWidth: number;
    containerHeight: number;
}) => {
    const layerRef = useRef<HTMLDivElement>(null);
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: layer.id,
        data: { layer },
        disabled: layer.locked || false
    });

    // Get position based on view mode
    let posX = layer.position?.x || 0;
    let posY = layer.position?.y || 0;

    if (viewMode === 'tablet' && layer.tabletPosition) {
        posX = layer.tabletPosition.x;
        posY = layer.tabletPosition.y;
    } else if (viewMode === 'mobile' && layer.mobilePosition) {
        posX = layer.mobilePosition.x;
        posY = layer.mobilePosition.y;
    }

    // Calculate pixel position
    const pixelX = (posX / 100) * containerWidth;
    const pixelY = (posY / 100) * containerHeight;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: pixelX,
        top: pixelY,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${layer.rotation || 0}deg)`
            : `rotate(${layer.rotation || 0}deg)`,
        cursor: layer.locked ? 'not-allowed' : 'grab',
        opacity: layer.visible === false ? 0.3 : (layer.opacity ?? 1),
        display: layer.visible === false ? 'none' : 'block',
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 'auto'),
        outline: isSelected ? '2px solid #00d4ff' : 'none',
        outlineOffset: '2px',
        boxShadow: isDragging ? '0 8px 32px rgba(0, 212, 255, 0.3)' : 'none',
        transition: isDragging ? 'none' : 'box-shadow 0.2s ease',
        ...layer.style,
    };

    // Apply border styling
    if (layer.border && layer.border.style !== 'none') {
        style.borderWidth = `${layer.border.top || layer.border.width || 0}px ${layer.border.right || layer.border.width || 0}px ${layer.border.bottom || layer.border.width || 0}px ${layer.border.left || layer.border.width || 0}px`;
        style.borderStyle = layer.border.style || 'solid';
        style.borderColor = layer.border.color || '#000000';
        style.borderRadius = `${layer.border.radius || 0}px`;
    }

    // Apply shadow
    if (layer.shadow && !isDragging) {
        const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = layer.shadow;
        style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!layer.locked) {
            onSelect(e.ctrlKey || e.metaKey);
        }
    };

    if (layer.type === 'image') {
        return (
            <div id={`layer-${layer.id}`} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={handleClick}>
                <img
                    src={layer.content || '/placeholder.png'}
                    alt="Layer"
                    draggable={false}
                    style={{
                        width: layer.style?.width || 'auto',
                        height: layer.style?.height || 'auto',
                        maxWidth: '100%',
                        pointerEvents: 'none',
                        display: 'block'
                    }}
                />
            </div>
        );
    }

    if (layer.type === 'icon') {
        return (
            <div id={`layer-${layer.id}`} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={handleClick}>
                {renderIcon(layer.content, layer.style?.fontSize)}
            </div>
        );
    }

    return (
        <div id={`layer-${layer.id}`} ref={setNodeRef} {...listeners} {...attributes} style={style} onClick={handleClick}>
            {layer.content}
        </div>
    );
};

// Grid Overlay Component
const GridOverlay = ({ width, height, gridSize = 20, show = false }: { width: number; height: number; gridSize?: number; show?: boolean }) => {
    if (!show) return null;

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
        >
            <defs>
                <pattern id="smallGrid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid" width={gridSize * 5} height={gridSize * 5} patternUnits="userSpaceOnUse">
                    <rect width={gridSize * 5} height={gridSize * 5} fill="url(#smallGrid)" />
                    <path d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    );
};

// Spacing Indicator Component
const SpacingLines = ({
    draggingLayerId,
    draggingPosition,
    layers,
    containerWidth,
    containerHeight,
    viewMode
}: {
    draggingLayerId: string | null;
    draggingPosition: { x: number; y: number } | null;
    layers: HeroSliderLayer[];
    containerWidth: number;
    containerHeight: number;
    viewMode: string;
}) => {
    if (!draggingLayerId || !draggingPosition) return null;

    const draggingLayer = layers.find(l => l.id === draggingLayerId);
    if (!draggingLayer) return null;

    const lines: React.ReactNode[] = [];
    const threshold = 150; // Only show for nearby elements

    // Get dragging layer position in pixels
    const dragX = draggingPosition.x;
    const dragY = draggingPosition.y;

    // Center lines
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Show center vertical guide
    if (Math.abs(dragX - centerX) < 20) {
        lines.push(
            <div
                key="center-v"
                style={{
                    position: 'absolute',
                    left: centerX,
                    top: 0,
                    width: 1,
                    height: containerHeight,
                    background: 'linear-gradient(to bottom, transparent, #ff6b6b, transparent)',
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
        );
    }

    // Show center horizontal guide
    if (Math.abs(dragY - centerY) < 20) {
        lines.push(
            <div
                key="center-h"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: centerY,
                    width: containerWidth,
                    height: 1,
                    background: 'linear-gradient(to right, transparent, #ff6b6b, transparent)',
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
        );
    }

    // Show spacing to other layers
    layers.forEach((otherLayer, idx) => {
        if (otherLayer.id === draggingLayerId || otherLayer.visible === false) return;

        let otherX = otherLayer.position?.x || 0;
        let otherY = otherLayer.position?.y || 0;

        if (viewMode === 'tablet' && otherLayer.tabletPosition) {
            otherX = otherLayer.tabletPosition.x;
            otherY = otherLayer.tabletPosition.y;
        } else if (viewMode === 'mobile' && otherLayer.mobilePosition) {
            otherX = otherLayer.mobilePosition.x;
            otherY = otherLayer.mobilePosition.y;
        }

        const otherPxX = (otherX / 100) * containerWidth;
        const otherPxY = (otherY / 100) * containerHeight;

        // Horizontal spacing
        const hDist = Math.abs(dragX - otherPxX);
        if (hDist < threshold && hDist > 5) {
            const minX = Math.min(dragX, otherPxX);
            const maxX = Math.max(dragX, otherPxX);
            const lineY = (dragY + otherPxY) / 2;

            lines.push(
                <React.Fragment key={`h-${idx}`}>
                    <div
                        style={{
                            position: 'absolute',
                            left: minX,
                            top: lineY,
                            width: maxX - minX,
                            height: 1,
                            backgroundColor: '#00d4ff',
                            zIndex: 999,
                            pointerEvents: 'none'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: minX + (maxX - minX) / 2 - 20,
                            top: lineY - 12,
                            backgroundColor: '#00d4ff',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        {Math.round(hDist)}px
                    </div>
                </React.Fragment>
            );
        }

        // Vertical spacing
        const vDist = Math.abs(dragY - otherPxY);
        if (vDist < threshold && vDist > 5) {
            const minY = Math.min(dragY, otherPxY);
            const maxY = Math.max(dragY, otherPxY);
            const lineX = (dragX + otherPxX) / 2;

            lines.push(
                <React.Fragment key={`v-${idx}`}>
                    <div
                        style={{
                            position: 'absolute',
                            left: lineX,
                            top: minY,
                            width: 1,
                            height: maxY - minY,
                            backgroundColor: '#00d4ff',
                            zIndex: 999,
                            pointerEvents: 'none'
                        }}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: lineX + 8,
                            top: minY + (maxY - minY) / 2 - 8,
                            backgroundColor: '#00d4ff',
                            color: '#000',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        {Math.round(vDist)}px
                    </div>
                </React.Fragment>
            );
        }
    });

    return <>{lines}</>;
};

// Ruler Component - shows actual dimensions, not scaled
const Ruler = ({ orientation, size, actualSize, zoom = 1 }: { orientation: 'horizontal' | 'vertical'; size: number; actualSize: number; zoom?: number }) => {
    const ticks = [];
    const majorInterval = 100;
    const minorInterval = 20;

    // Draw ticks based on actual dimensions
    for (let i = 0; i <= actualSize; i += minorInterval) {
        const isMajor = i % majorInterval === 0;
        const scaledPos = (i / actualSize) * size;
        ticks.push(
            <div
                key={i}
                style={{
                    position: 'absolute',
                    ...(orientation === 'horizontal'
                        ? { left: scaledPos, top: isMajor ? 0 : 10, width: 1, height: isMajor ? 20 : 10 }
                        : { top: scaledPos, left: isMajor ? 0 : 10, height: 1, width: isMajor ? 20 : 10 }
                    ),
                    backgroundColor: isMajor ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)'
                }}
            >
                {isMajor && (
                    <span style={{
                        position: 'absolute',
                        fontSize: 9,
                        color: 'rgba(255,255,255,0.6)',
                        ...(orientation === 'horizontal'
                            ? { left: 3, top: 2 }
                            : { top: 3, left: 2, writingMode: 'vertical-lr' }
                        )
                    }}>
                        {i}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div style={{
            position: 'absolute',
            backgroundColor: '#1a1a2e',
            ...(orientation === 'horizontal'
                ? { top: -20, left: 0, width: size, height: 20 }
                : { top: 0, left: -20, width: 20, height: size }
            ),
            overflow: 'hidden'
        }}>
            {ticks}
        </div>
    );
};

export default function SlideCanvas({
    slide,
    selectedLayerIds,
    onSelectLayer,
    onUpdateLayer,
    onUpdateSlide,
    viewMode,
    settings,
    showGrid = false,
    snapToGrid = false,
    zoom = 1
}: SlideCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
    const [draggingPosition, setDraggingPosition] = useState<{ x: number; y: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 3 }
        })
    );

    // Calculate canvas dimensions - use actual settings width for desktop
    const getCanvasDimensions = useCallback(() => {
        let baseWidth = settings?.width || 1920;
        let baseHeight = 600;

        if (typeof settings?.height === 'number') {
            baseHeight = settings.height;
        } else if (settings?.height) {
            baseHeight = settings.height[viewMode] || settings.height.desktop || 600;
        }

        if (viewMode === 'tablet') {
            baseWidth = 768;
        } else if (viewMode === 'mobile') {
            baseWidth = 375;
        }
        // For desktop, use actual settings width

        return {
            width: baseWidth * zoom,
            height: baseHeight * zoom,
            baseWidth,
            baseHeight
        };
    }, [settings, viewMode, zoom]);

    useEffect(() => {
        const dims = getCanvasDimensions();
        setContainerSize({ width: dims.width, height: dims.height });
    }, [getCanvasDimensions]);

    const dims = getCanvasDimensions();
    const { width, height } = containerSize;
    const { baseWidth, baseHeight } = dims;

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const layer = slide.layers.find(l => l.id === event.active.id);
        if (!layer) return;

        setDraggingLayerId(layer.id);

        let posX = layer.position?.x || 0;
        let posY = layer.position?.y || 0;

        if (viewMode === 'tablet' && layer.tabletPosition) {
            posX = layer.tabletPosition.x;
            posY = layer.tabletPosition.y;
        } else if (viewMode === 'mobile' && layer.mobilePosition) {
            posX = layer.mobilePosition.x;
            posY = layer.mobilePosition.y;
        }

        setDraggingPosition({
            x: (posX / 100) * width,
            y: (posY / 100) * height
        });
    }, [slide.layers, viewMode, width, height]);

    const handleDragMove = useCallback((event: DragMoveEvent) => {
        const layer = slide.layers.find(l => l.id === event.active.id);
        if (!layer) return;

        let posX = layer.position?.x || 0;
        let posY = layer.position?.y || 0;

        if (viewMode === 'tablet' && layer.tabletPosition) {
            posX = layer.tabletPosition.x;
            posY = layer.tabletPosition.y;
        } else if (viewMode === 'mobile' && layer.mobilePosition) {
            posX = layer.mobilePosition.x;
            posY = layer.mobilePosition.y;
        }

        const baseX = (posX / 100) * width;
        const baseY = (posY / 100) * height;

        setDraggingPosition({
            x: baseX + event.delta.x,
            y: baseY + event.delta.y
        });
    }, [slide.layers, viewMode, width, height]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setDraggingLayerId(null);
        setDraggingPosition(null);

        const { active, delta } = event;
        const layer = slide.layers.find(l => l.id === active.id);
        if (!layer || layer.locked || !width || !height) return;

        // Convert delta to percentage
        let deltaXPercent = (delta.x / width) * 100;
        let deltaYPercent = (delta.y / height) * 100;

        // Apply grid snapping if enabled
        if (snapToGrid) {
            const gridPercent = (20 / width) * 100; // 20px grid
            deltaXPercent = Math.round(deltaXPercent / gridPercent) * gridPercent;
            deltaYPercent = Math.round(deltaYPercent / gridPercent) * gridPercent;
        }

        // Get current position based on view mode
        let currentX = layer.position?.x || 0;
        let currentY = layer.position?.y || 0;

        if (viewMode === 'tablet') {
            currentX = layer.tabletPosition?.x ?? layer.position?.x ?? 0;
            currentY = layer.tabletPosition?.y ?? layer.position?.y ?? 0;
        } else if (viewMode === 'mobile') {
            currentX = layer.mobilePosition?.x ?? layer.position?.x ?? 0;
            currentY = layer.mobilePosition?.y ?? layer.position?.y ?? 0;
        }

        // Calculate new position
        const newPos = {
            x: Math.max(0, Math.min(100, currentX + deltaXPercent)),
            y: Math.max(0, Math.min(100, currentY + deltaYPercent))
        };

        // Update based on view mode
        const updates: Partial<HeroSliderLayer> = {};

        if (viewMode === 'desktop') {
            updates.position = newPos;
        } else if (viewMode === 'tablet') {
            updates.tabletPosition = newPos;
        } else if (viewMode === 'mobile') {
            updates.mobilePosition = newPos;
        }

        onUpdateLayer(layer.id, updates);
        onSelectLayer(layer.id);
    }, [slide.layers, width, height, snapToGrid, viewMode, onUpdateLayer, onSelectLayer]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onSelectLayer('');
        }
    };

    // Background style
    const backgroundStyle: React.CSSProperties = {
        width,
        height,
        backgroundColor: slide.background?.type === 'color' ? slide.background.value : '#1a1a2e',
        backgroundImage: slide.background?.type === 'image' ? `url(${slide.background.value})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    };

    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                width: '100%',
                height: '100%',
                backgroundColor: '#0d0d1a',
                backgroundImage: 'radial-gradient(circle at 50% 50%, #1a1a2e 0%, #0d0d1a 100%)',
                p: 4,
                pl: 6,
                pt: 6,
                overflow: 'auto',
                position: 'relative'
            }}
        >
            {/* Canvas Wrapper with Rulers */}
            <Box sx={{ position: 'relative' }}>
                {/* Rulers - show actual dimensions */}
                <Ruler orientation="horizontal" size={width} actualSize={baseWidth} zoom={zoom} />
                <Ruler orientation="vertical" size={height} actualSize={baseHeight} zoom={zoom} />

                {/* Corner */}
                <Box sx={{
                    position: 'absolute',
                    top: -20,
                    left: -20,
                    width: 20,
                    height: 20,
                    backgroundColor: '#1a1a2e'
                }} />

                {/* Main Canvas */}
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragEnd={handleDragEnd}
                >
                    <div
                        id="slide-canvas-container"
                        ref={containerRef}
                        style={backgroundStyle}
                        onClick={handleCanvasClick}
                    >
                        {/* Grid Overlay */}
                        <GridOverlay width={width} height={height} gridSize={20} show={showGrid || !!draggingLayerId} />

                        {/* Overlay */}
                        {slide.background?.overlay && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                backgroundColor: slide.background.overlay,
                                opacity: slide.background.overlayOpacity ?? 0.5,
                                pointerEvents: 'none',
                                zIndex: 0
                            }} />
                        )}

                        {/* Spacing Lines */}
                        <SpacingLines
                            draggingLayerId={draggingLayerId}
                            draggingPosition={draggingPosition}
                            layers={slide.layers}
                            containerWidth={width}
                            containerHeight={height}
                            viewMode={viewMode}
                        />

                        {/* Layers */}
                        {slide.layers.map(layer => (
                            <DraggableLayer
                                key={layer.id}
                                id={`layer-${layer.id}`}
                                layer={layer}
                                isSelected={selectedLayerIds.includes(layer.id)}
                                onSelect={(addToSelection) => onSelectLayer(layer.id, addToSelection)}
                                viewMode={viewMode}
                                containerWidth={width}
                                containerHeight={height}
                            />
                        ))}
                    </div>
                </DndContext>

                {/* Canvas Info */}
                <Box sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center'
                }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {baseWidth} × {baseHeight}px
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                        {Math.round(zoom * 100)}%
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
}
