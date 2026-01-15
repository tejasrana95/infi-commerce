import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { DndContext, useDraggable, DragEndEvent, DragStartEvent, DragMoveEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { HeroSliderSlide, HeroSliderLayer } from '@/services/heroSlider.service';

import DynamicIcon from '../../atoms/DynamicIcon';

// Viewport dimensions constants - must match frontend breakpoints exactly
export const VIEWPORT_DIMENSIONS = {
    desktop: { width: 1200 },
    tablet: { width: 768 },
    mobile: { width: 375 }
} as const;

interface SlideCanvasProps {
    slide: HeroSliderSlide;
    selectedLayerIds: string[];
    onSelectLayer: (id: string, addToSelection?: boolean) => void;
    onUpdateLayer: (id: string, updates: Partial<HeroSliderLayer>) => void;
    onUpdateSlide: (updates: Partial<HeroSliderSlide>) => void;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    settings: any;
    showGrid?: boolean;
    snapToGrid?: boolean;
    zoom?: number;
    onBatchUpdateLayers?: (updates: Array<{ id: string; updates: Partial<HeroSliderLayer> }>) => void;
}

const renderIcon = (iconName: string, fontSize: any) => {
    const size = parseInt(fontSize) || 24;
    return <DynamicIcon name={iconName} size={size} />;
};

/**
 * Get position for a specific viewport with proper fallback chain
 * Desktop -> Tablet (inherits from Desktop) -> Mobile (inherits from Tablet)
 */
export const getPositionForViewport = (
    layer: HeroSliderLayer,
    viewMode: 'desktop' | 'tablet' | 'mobile'
): { x: number; y: number } => {
    const desktopPos = layer.position || { x: 0, y: 0 };
    const tabletPos = layer.tabletPosition || desktopPos;
    const mobilePos = layer.mobilePosition || tabletPos;

    if (viewMode === 'mobile') return mobilePos;
    if (viewMode === 'tablet') return tabletPos;
    return desktopPos;
};

/**
 * Get style for a specific viewport with proper inheritance
 * Desktop -> Tablet (merges with Desktop) -> Mobile (merges with Tablet)
 */
export const getStyleForViewport = (
    layer: HeroSliderLayer,
    viewMode: 'desktop' | 'tablet' | 'mobile'
): any => {
    const desktopStyle = layer.style || {};
    const tabletStyle = layer.tabletStyle ? { ...desktopStyle, ...layer.tabletStyle } : desktopStyle;
    const mobileStyle = layer.mobileStyle ? { ...tabletStyle, ...layer.mobileStyle } : tabletStyle;

    if (viewMode === 'mobile') return mobileStyle;
    if (viewMode === 'tablet') return tabletStyle;
    return desktopStyle;
};

/**
 * Get visibility for a specific viewport with proper inheritance
 */
export const getVisibilityForViewport = (
    layer: HeroSliderLayer,
    viewMode: 'desktop' | 'tablet' | 'mobile'
): boolean => {
    const desktopVisible = layer.visible !== false;
    const tabletVisible = layer.tabletVisible ?? desktopVisible;
    const mobileVisible = layer.mobileVisible ?? tabletVisible;

    if (viewMode === 'mobile') return mobileVisible;
    if (viewMode === 'tablet') return tabletVisible;
    return desktopVisible;
};

const ResizeHandle = ({
    cursor,
    onPointerDown,
    style
}: {
    cursor: string;
    onPointerDown: (e: React.PointerEvent) => void;
    style: React.CSSProperties
}) => (
    <div
        onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e); }}
        style={{
            position: 'absolute',
            width: 10,
            height: 10,
            backgroundColor: '#fff',
            border: '1px solid #00d4ff',
            borderRadius: '50%',
            zIndex: 1001,
            cursor,
            ...style
        }}
    />
);

// Section Content Component - renders the grid with actual child content
const SectionContent = ({
    layer,
    viewMode,
    isSelected,
    allLayers,
    onSelectLayer
}: {
    layer: HeroSliderLayer;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    isSelected: boolean;
    allLayers?: HeroSliderLayer[];
    onSelectLayer?: (id: string, addToSelection?: boolean) => void;
}) => {
    const layout = layer.sectionLayout;
    if (!layout) return null;

    // Get responsive columns
    const columns = viewMode === 'mobile'
        ? (layout.mobileColumns || 1)
        : viewMode === 'tablet'
            ? (layout.tabletColumns || layout.columns)
            : layout.columns;

    const gap = viewMode === 'mobile'
        ? (layout.mobileGap ?? layout.gap)
        : viewMode === 'tablet'
            ? (layout.tabletGap ?? layout.gap)
            : layout.gap;

    const direction = viewMode === 'mobile'
        ? (layout.mobileDirection || 'column')
        : viewMode === 'tablet'
            ? (layout.tabletDirection || layout.direction)
            : layout.direction;

    // Get actual child layers
    const childLayers = layer.children && allLayers
        ? layer.children.map(id => allLayers.find(l => l.id === id)).filter(Boolean) as HeroSliderLayer[]
        : [];

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: direction === 'column' ? 'flex' : 'grid',
                flexDirection: direction === 'column' ? 'column' : undefined,
                gridTemplateColumns: direction !== 'column' ? `repeat(${columns}, 1fr)` : undefined,
                gap: `${gap}px`,
                // For grid: alignItems = vertical alignment, justifyItems = horizontal alignment
                // For flex: alignItems = cross-axis, justifyContent = main-axis
                alignItems: layout.alignment,
                justifyItems: direction !== 'column' ? layout.justify : undefined,
                justifyContent: direction === 'column' ? layout.justify : undefined,
                padding: layout.padding ?
                    `${layout.padding.top || 0}px ${layout.padding.right || 0}px ${layout.padding.bottom || 0}px ${layout.padding.left || 0}px`
                    : '16px',
                border: isSelected ? '2px dashed rgba(0, 212, 255, 0.5)' : '2px dashed rgba(255,255,255,0.2)',
                borderRadius: '8px',
                minHeight: childLayers.length === 0 ? 60 : 'auto',
                position: 'relative',
                backgroundColor: 'rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}
        >
            {childLayers.length === 0 ? (
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 12,
                    textAlign: 'center',
                    padding: 2,
                    gridColumn: `span ${columns}`
                }}>
                    <Box>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, mb: 0.5 }}>
                            {columns} Column Section
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                            Select this section and use Layer List to add content
                        </Typography>
                    </Box>
                </Box>
            ) : (
                // Render actual child layers with their content and styles
                childLayers.map((childLayer) => {
                    const childStyle = getStyleForViewport(childLayer, viewMode);
                    const isVisible = getVisibilityForViewport(childLayer, viewMode);

                    if (!isVisible) return null;

                    // Build border styles
                    const borderStyles: React.CSSProperties = {};
                    if (childLayer.border && childLayer.border.style !== 'none') {
                        const defaultWidth = childLayer.border.width ?? 1;
                        borderStyles.borderWidth = `${childLayer.border.top ?? defaultWidth}px ${childLayer.border.right ?? defaultWidth}px ${childLayer.border.bottom ?? defaultWidth}px ${childLayer.border.left ?? defaultWidth}px`;
                        borderStyles.borderStyle = childLayer.border.style || 'solid';
                        borderStyles.borderColor = childLayer.border.color || '#000000';
                        if (childLayer.border.radius !== undefined) {
                            borderStyles.borderRadius = `${childLayer.border.radius}px`;
                        }
                    }

                    // Build shadow styles
                    const shadowStyles: React.CSSProperties = {};
                    if (childLayer.shadow) {
                        const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = childLayer.shadow;
                        shadowStyles.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
                    }

                    // Combined styles - removing position properties since grid handles layout
                    const { left, top, right, bottom, position, ...restStyle } = childStyle || {};

                    return (
                        <Box
                            key={childLayer.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectLayer?.(childLayer.id);
                            }}
                            sx={{
                                ...restStyle,
                                ...borderStyles,
                                ...shadowStyles,
                                opacity: childLayer.opacity ?? 1,
                                transform: childLayer.rotation ? `rotate(${childLayer.rotation}deg)` : undefined,
                                cursor: 'pointer',
                                transition: 'outline 0.2s',
                                '&:hover': {
                                    outline: '2px solid rgba(0, 212, 255, 0.5)'
                                },
                                minHeight: 40,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: childStyle?.textAlign === 'center' ? 'center' :
                                    childStyle?.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            }}
                        >
                            {childLayer.type === 'text' && childLayer.content}
                            {childLayer.type === 'rte' && (
                                <div
                                    dangerouslySetInnerHTML={{ __html: childLayer.content }}
                                    style={{ width: '100%' }}
                                />
                            )}
                            {childLayer.type === 'button' && (
                                <Box sx={{
                                    display: 'inline-block',
                                    cursor: 'pointer'
                                }}>
                                    {childLayer.content}
                                </Box>
                            )}
                            {childLayer.type === 'image' && (
                                <img
                                    src={childLayer.content || '/placeholder.png'}
                                    alt="Layer"
                                    draggable={false}
                                    style={{
                                        width: '100%',
                                        height: 'auto',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        display: 'block',
                                        pointerEvents: 'none'
                                    }}
                                />
                            )}
                            {childLayer.type === 'icon' && (
                                <Box sx={{ color: childStyle?.color || 'inherit' }}>
                                    {renderIcon(childLayer.content, childStyle?.fontSize)}
                                </Box>
                            )}
                            {/* Recursive nested section rendering */}
                            {childLayer.type === 'section' && (
                                <SectionContent
                                    layer={childLayer}
                                    viewMode={viewMode}
                                    isSelected={false}
                                    allLayers={allLayers}
                                    onSelectLayer={onSelectLayer}
                                />
                            )}
                        </Box>
                    );
                })
            )}
        </Box>
    );
};

interface DraggableLayerProps {
    layer: HeroSliderLayer;
    isSelected: boolean;
    onSelect: (addToSelection?: boolean) => void;
    onUpdateLayer: (updates: Partial<HeroSliderLayer>) => void;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    containerWidth: number;
    containerHeight: number;
    groupDragDelta?: { x: number; y: number } | null;
    allLayers?: HeroSliderLayer[];
    onSelectLayerById?: (id: string, addToSelection?: boolean) => void;
    zoom?: number;
}

const DraggableLayer = ({
    layer,
    isSelected,
    onSelect,
    onUpdateLayer,
    viewMode,
    containerWidth,
    containerHeight,
    groupDragDelta,
    allLayers,
    onSelectLayerById,
    zoom = 1
}: DraggableLayerProps) => {
    const layerRef = useRef<HTMLDivElement>(null);
    const [resizeState, setResizeState] = useState<{
        active: boolean;
        width: number;
        height: number;
        x: number;
        y: number;
    } | null>(null);

    // Store current values in refs for event handlers
    const stateRef = useRef({
        containerWidth,
        containerHeight,
        viewMode,
        layer,
        onUpdateLayer
    });

    useEffect(() => {
        stateRef.current = {
            containerWidth,
            containerHeight,
            viewMode,
            layer,
            onUpdateLayer
        };
    });

    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: layer.id,
        data: { layer },
        disabled: layer.locked || false
    });

    // Get position for current viewport with proper fallback
    const position = getPositionForViewport(layer, viewMode);
    const posX = position.x;
    const posY = position.y;

    // Calculate pixel position
    const basePixelX = (posX / 100) * containerWidth;
    const basePixelY = (posY / 100) * containerHeight;
    const pixelX = resizeState?.active ? resizeState.x : basePixelX;
    const pixelY = resizeState?.active ? resizeState.y : basePixelY;

    // Determine transform - use groupDragDelta for selected layers during group drag
    const effectiveTransform = isDragging
        ? transform
        : (isSelected && groupDragDelta)
            ? { x: groupDragDelta.x, y: groupDragDelta.y }
            : null;

    const effectiveLayerStyle = getStyleForViewport(layer, viewMode);
    const isVisible = getVisibilityForViewport(layer, viewMode);

    const style: React.CSSProperties = {
        position: 'absolute',
        left: pixelX,
        top: pixelY,
        width: resizeState?.active ? resizeState.width : effectiveLayerStyle?.width,
        height: resizeState?.active ? resizeState.height : effectiveLayerStyle?.height,
        transform: effectiveTransform
            ? `translate3d(${effectiveTransform.x}px, ${effectiveTransform.y}px, 0) rotate(${layer.rotation || 0}deg)`
            : `rotate(${layer.rotation || 0}deg)`,
        cursor: layer.locked ? 'not-allowed' : 'grab',
        opacity: !isVisible ? 0.3 : (layer.opacity ?? 1),
        display: !isVisible ? 'none' : 'block',
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 'auto'),
        outline: resizeState?.active ? '3px solid #00d4ff' : (isSelected ? '2px solid #00d4ff' : 'none'),
        outlineOffset: '2px',
        boxShadow: resizeState?.active ? '0 0 20px rgba(0, 212, 255, 0.6)' : (isDragging ? '0 8px 32px rgba(0, 212, 255, 0.3)' : 'none'),
        transition: 'none',
        ...(!resizeState?.active && effectiveLayerStyle),
        textAlign: effectiveLayerStyle?.textAlign,
    };

    // Apply border styling
    if (layer.border && layer.border.style !== 'none') {
        style.borderWidth = `${layer.border.top || layer.border.width || 0}px ${layer.border.right || layer.border.width || 0}px ${layer.border.bottom || layer.border.width || 0}px ${layer.border.left || layer.border.width || 0}px`;
        style.borderStyle = layer.border.style || 'solid';
        style.borderColor = layer.border.color || '#000000';
        style.borderRadius = `${layer.border.radius || 0}px`;
    }

    // Apply shadow (only when not resizing)
    if (layer.shadow && !isDragging && !resizeState?.active) {
        const { x = 0, y = 0, blur = 0, spread = 0, color = 'rgba(0,0,0,0.5)' } = layer.shadow;
        style.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!layer.locked) {
            onSelect(e.ctrlKey || e.metaKey);
        }
    };

    // Resize handlers
    const resizeDataRef = useRef<{
        direction: string;
        startX: number;
        startY: number;
        startWidth: number;
        startHeight: number;
        startLeft: number;
        startTop: number;
    } | null>(null);

    const onPointerMove = useCallback((e: PointerEvent) => {
        if (!resizeDataRef.current) return;

        const { direction, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeDataRef.current;
        // Adjust deltas for zoom - mouse moves in screen space, canvas is scaled
        const deltaX = (e.clientX - startX) / zoom;
        const deltaY = (e.clientY - startY) / zoom;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startLeft;
        let newY = startTop;

        if (direction.includes('e')) newWidth = Math.max(20, startWidth + deltaX);
        if (direction.includes('w')) {
            newWidth = Math.max(20, startWidth - deltaX);
            newX = startLeft + startWidth - newWidth;
        }
        if (direction.includes('s')) newHeight = Math.max(20, startHeight + deltaY);
        if (direction.includes('n')) {
            newHeight = Math.max(20, startHeight - deltaY);
            newY = startTop + startHeight - newHeight;
        }

        setResizeState({ active: true, width: newWidth, height: newHeight, x: newX, y: newY });
    }, [zoom]);

    const onPointerUp = useCallback(() => {
        if (!resizeDataRef.current) return;

        const { direction } = resizeDataRef.current;
        const state = stateRef.current;

        setResizeState(prev => {
            if (!prev) return null;

            const newPosPercent = {
                x: (prev.x / state.containerWidth) * 100,
                y: (prev.y / state.containerHeight) * 100
            };

            const updates: Partial<HeroSliderLayer> = {};

            if (state.viewMode === 'desktop') {
                updates.style = { ...state.layer.style, width: prev.width, height: prev.height };
                if (direction.includes('w') || direction.includes('n')) {
                    updates.position = newPosPercent;
                }
            } else if (state.viewMode === 'tablet') {
                updates.tabletStyle = { ...state.layer.tabletStyle, width: prev.width, height: prev.height };
                if (direction.includes('w') || direction.includes('n')) {
                    updates.tabletPosition = newPosPercent;
                }
            } else if (state.viewMode === 'mobile') {
                updates.mobileStyle = { ...state.layer.mobileStyle, width: prev.width, height: prev.height };
                if (direction.includes('w') || direction.includes('n')) {
                    updates.mobilePosition = newPosPercent;
                }
            }

            state.onUpdateLayer(updates);
            return null;
        });

        resizeDataRef.current = null;
    }, []);

    // Store current handlers in a ref for event listener management
    const handlersRef = useRef({ onPointerMove, onPointerUp });

    // Update handlers ref when callbacks change
    useEffect(() => {
        handlersRef.current = { onPointerMove, onPointerUp };
    }, [onPointerMove, onPointerUp]);

    const handleResizeStart = (e: React.PointerEvent, direction: string) => {
        e.stopPropagation();
        e.preventDefault();

        const rect = layerRef.current?.getBoundingClientRect();
        if (!rect) return;

        // getBoundingClientRect returns scaled dimensions, so divide by zoom to get actual size
        const actualWidth = rect.width / zoom;
        const actualHeight = rect.height / zoom;

        resizeDataRef.current = {
            direction,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: actualWidth,
            startHeight: actualHeight,
            startLeft: basePixelX,
            startTop: basePixelY
        };

        setResizeState({
            active: true,
            width: actualWidth,
            height: actualHeight,
            x: basePixelX,
            y: basePixelY
        });

        // Use pointer events for better cross-browser compatibility
        const moveHandler = (ev: PointerEvent) => handlersRef.current.onPointerMove(ev);
        const upHandler = () => {
            handlersRef.current.onPointerUp();
            document.removeEventListener('pointermove', moveHandler);
            document.removeEventListener('pointerup', upHandler);
            document.removeEventListener('pointercancel', upHandler);
        };

        document.addEventListener('pointermove', moveHandler);
        document.addEventListener('pointerup', upHandler);
        document.addEventListener('pointercancel', upHandler);
    };

    const content = (
        <>
            {layer.type === 'image' && (
                <img
                    src={layer.content || '/placeholder.png'}
                    alt="Layer"
                    draggable={false}
                    style={{
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        display: 'block'
                    }}
                />
            )}
            {layer.type === 'icon' && (
                <Box sx={{ color: layer.style?.color || 'inherit' }}>
                    {renderIcon(layer.content, layer.style?.fontSize)}
                </Box>
            )}
            {layer.type === 'rte' && <div dangerouslySetInnerHTML={{ __html: layer.content }} />}
            {layer.type === 'text' && layer.content}
            {layer.type === 'button' && layer.content}
            {layer.type === 'section' && (
                <SectionContent
                    layer={layer}
                    viewMode={viewMode}
                    isSelected={isSelected}
                    allLayers={allLayers}
                    onSelectLayer={onSelectLayerById}
                />
            )}

            {/* Resize Handles */}
            {isSelected && !layer.locked && (
                <>
                    <ResizeHandle cursor="nw-resize" onPointerDown={(e) => handleResizeStart(e, 'nw')} style={{ top: -5, left: -5 }} />
                    <ResizeHandle cursor="ne-resize" onPointerDown={(e) => handleResizeStart(e, 'ne')} style={{ top: -5, right: -5 }} />
                    <ResizeHandle cursor="sw-resize" onPointerDown={(e) => handleResizeStart(e, 'sw')} style={{ bottom: -5, left: -5 }} />
                    <ResizeHandle cursor="se-resize" onPointerDown={(e) => handleResizeStart(e, 'se')} style={{ bottom: -5, right: -5 }} />
                    <ResizeHandle cursor="n-resize" onPointerDown={(e) => handleResizeStart(e, 'n')} style={{ top: -5, left: '50%', transform: 'translateX(-50%)' }} />
                    <ResizeHandle cursor="s-resize" onPointerDown={(e) => handleResizeStart(e, 's')} style={{ bottom: -5, left: '50%', transform: 'translateX(-50%)' }} />
                    <ResizeHandle cursor="e-resize" onPointerDown={(e) => handleResizeStart(e, 'e')} style={{ right: -5, top: '50%', transform: 'translateY(-50%)' }} />
                    <ResizeHandle cursor="w-resize" onPointerDown={(e) => handleResizeStart(e, 'w')} style={{ left: -5, top: '50%', transform: 'translateY(-50%)' }} />
                </>
            )}
        </>
    );

    return (
        <div
            id={`layer-${layer.id}`}
            ref={(node) => {
                setNodeRef(node);
                // @ts-ignore
                layerRef.current = node;
            }}
            {...listeners}
            {...attributes}
            style={style}
            onClick={handleClick}
        >
            {content}
        </div>
    );
};

// Grid Overlay Component
const GridOverlay = ({
    width,
    height,
    gridSize = 20,
    show = false
}: {
    width: number;
    height: number;
    gridSize?: number;
    show?: boolean
}) => {
    if (!show) return null;

    return (
        <svg
            width={width}
            height={height}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 1 }}
        >
            <defs>
                <pattern id="smallGrid" width={gridSize} height={gridSize} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                    <path d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
                </pattern>
                <pattern id="grid" width={gridSize * 5} height={gridSize * 5} patternUnits="userSpaceOnUse">
                    <rect width={gridSize * 5} height={gridSize * 5} fill="url(#smallGrid)" />
                    <path d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
                    <path d={`M ${gridSize * 5} 0 L 0 0 0 ${gridSize * 5}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
    );
};

// Center guides component
const CenterGuides = ({
    show,
    width,
    height,
    draggingPosition
}: {
    show: boolean;
    width: number;
    height: number;
    draggingPosition: { x: number; y: number } | null
}) => {
    if (!show || !draggingPosition) return null;

    const centerX = width / 2;
    const centerY = height / 2;
    const lines: React.ReactNode[] = [];

    // Show center vertical guide
    if (Math.abs(draggingPosition.x - centerX) < 20) {
        lines.push(
            <div
                key="center-v"
                style={{
                    position: 'absolute',
                    left: centerX,
                    top: 0,
                    width: 1,
                    height: height,
                    background: 'linear-gradient(to bottom, transparent, #ff6b6b, transparent)',
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
        );
    }

    // Show center horizontal guide
    if (Math.abs(draggingPosition.y - centerY) < 20) {
        lines.push(
            <div
                key="center-h"
                style={{
                    position: 'absolute',
                    left: 0,
                    top: centerY,
                    width: width,
                    height: 1,
                    background: 'linear-gradient(to right, transparent, #ff6b6b, transparent)',
                    zIndex: 999,
                    pointerEvents: 'none'
                }}
            />
        );
    }

    return <>{lines}</>;
};

// Ruler Component
const Ruler = ({
    orientation,
    size,
    actualSize
}: {
    orientation: 'horizontal' | 'vertical';
    size: number;
    actualSize: number;
}) => {
    const ticks = [];
    const majorInterval = 100;
    const minorInterval = 20;

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
    zoom = 1,
    onBatchUpdateLayers
}: SlideCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
    const [draggingPosition, setDraggingPosition] = useState<{ x: number; y: number } | null>(null);
    const [currentDragDelta, setCurrentDragDelta] = useState<{ x: number; y: number } | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 3 }
        })
    );

    // Calculate canvas dimensions based on viewport mode
    // IMPORTANT: Use the exact viewport widths for tablet/mobile to match frontend
    const canvasDimensions = useMemo(() => {
        let baseWidth: number;
        let baseHeight = 600;

        // Get the appropriate width for the viewport mode
        if (viewMode === 'desktop') {
            // For desktop, use settings.width if available, otherwise use standard desktop width
            baseWidth = settings?.width || VIEWPORT_DIMENSIONS.desktop.width;
        } else {
            // For tablet/mobile, use fixed viewport widths to match frontend breakpoints
            baseWidth = VIEWPORT_DIMENSIONS[viewMode].width;
        }

        // Get height from settings (supports responsive height object)
        if (typeof settings?.height === 'number') {
            baseHeight = settings.height;
        } else if (settings?.height && typeof settings.height === 'object') {
            baseHeight = settings.height[viewMode] || settings.height.desktop || 600;
        }

        return {
            // Don't multiply by zoom - we use CSS transform scale instead
            width: baseWidth,
            height: baseHeight,
            baseWidth,
            baseHeight
        };
    }, [settings, viewMode]);

    const { width, height, baseWidth, baseHeight } = canvasDimensions;

    const handleDragStart = useCallback((event: DragStartEvent) => {
        const layer = slide.layers.find(l => l.id === event.active.id);
        if (!layer) return;

        setDraggingLayerId(layer.id);

        const position = getPositionForViewport(layer, viewMode);
        setDraggingPosition({
            x: (position.x / 100) * width,
            y: (position.y / 100) * height
        });
    }, [slide.layers, viewMode, width, height]);

    const handleDragMove = useCallback((event: DragMoveEvent) => {
        const layer = slide.layers.find(l => l.id === event.active.id);
        if (!layer) return;

        const position = getPositionForViewport(layer, viewMode);
        const baseX = (position.x / 100) * width;
        const baseY = (position.y / 100) * height;

        // Adjust delta for zoom - mouse moves in screen space, canvas is scaled
        const adjustedDeltaX = event.delta.x / zoom;
        const adjustedDeltaY = event.delta.y / zoom;

        setDraggingPosition({
            x: baseX + adjustedDeltaX,
            y: baseY + adjustedDeltaY
        });

        setCurrentDragDelta({ x: adjustedDeltaX, y: adjustedDeltaY });
    }, [slide.layers, viewMode, width, height, zoom]);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setDraggingLayerId(null);
        setDraggingPosition(null);
        setCurrentDragDelta(null);

        const { active, delta } = event;
        const draggedLayer = slide.layers.find(l => l.id === active.id);
        if (!draggedLayer || draggedLayer.locked || !width || !height) return;

        // Adjust delta for zoom - mouse moves in screen space, canvas is scaled
        const adjustedDeltaX = delta.x / zoom;
        const adjustedDeltaY = delta.y / zoom;

        // Convert delta to percentage relative to current viewport dimensions
        let deltaXPercent = (adjustedDeltaX / width) * 100;
        let deltaYPercent = (adjustedDeltaY / height) * 100;

        // Apply grid snapping if enabled
        if (snapToGrid) {
            const gridPercent = (20 / width) * 100;
            deltaXPercent = Math.round(deltaXPercent / gridPercent) * gridPercent;
            deltaYPercent = Math.round(deltaYPercent / gridPercent) * gridPercent;
        }

        // Determine which layers to move
        const layersToMove = selectedLayerIds.includes(draggedLayer.id) && selectedLayerIds.length > 1
            ? slide.layers.filter(l => selectedLayerIds.includes(l.id) && !l.locked)
            : [draggedLayer];

        const batchUpdates: Array<{ id: string; updates: Partial<HeroSliderLayer> }> = [];

        layersToMove.forEach(layer => {
            // Get current position for this viewport (with proper fallback)
            const currentPos = getPositionForViewport(layer, viewMode);

            // Calculate new position
            const newPos = {
                x: Math.max(0, Math.min(100, currentPos.x + deltaXPercent)),
                y: Math.max(0, Math.min(100, currentPos.y + deltaYPercent))
            };

            // Build update based on view mode - save to the correct viewport position property
            const updates: Partial<HeroSliderLayer> = {};

            if (viewMode === 'desktop') {
                updates.position = newPos;
            } else if (viewMode === 'tablet') {
                updates.tabletPosition = newPos;
            } else if (viewMode === 'mobile') {
                updates.mobilePosition = newPos;
            }

            batchUpdates.push({ id: layer.id, updates });
        });

        // Apply all updates atomically
        if (onBatchUpdateLayers && batchUpdates.length > 1) {
            onBatchUpdateLayers(batchUpdates);
        } else {
            batchUpdates.forEach(({ id, updates }) => onUpdateLayer(id, updates));
        }

        // Keep selection
        if (!selectedLayerIds.includes(draggedLayer.id)) {
            onSelectLayer(draggedLayer.id);
        }
    }, [slide.layers, width, height, snapToGrid, viewMode, onUpdateLayer, onSelectLayer, selectedLayerIds, onBatchUpdateLayers, zoom]);

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onSelectLayer('');
        }
    };

    // Background style - apply zoom via CSS transform for proper layer scaling
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
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
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
            <Box sx={{ position: 'relative' }}>
                {/* Rulers - show zoomed size for visual reference */}
                <Ruler orientation="horizontal" size={width * zoom} actualSize={baseWidth} />
                <Ruler orientation="vertical" size={height * zoom} actualSize={baseHeight} />

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
                        data-viewport={viewMode}
                        data-canvas-width={width}
                        data-canvas-height={height}
                        data-base-width={baseWidth}
                        data-base-height={baseHeight}
                    >
                        {/* Grid Overlay */}
                        <GridOverlay width={width} height={height} gridSize={20} show={showGrid || !!draggingLayerId} />

                        {/* Background Overlay */}
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

                        {/* Center Guides */}
                        <CenterGuides
                            show={!!draggingLayerId}
                            width={width}
                            height={height}
                            draggingPosition={draggingPosition}
                        />

                        {/* Layers - only render root layers (not children of sections) */}
                        {slide.layers
                            .filter(layer => !layer.parentId) // Filter out child layers
                            .map(layer => (
                                <DraggableLayer
                                    key={layer.id}
                                    layer={layer}
                                    isSelected={selectedLayerIds.includes(layer.id)}
                                    onSelect={(addToSelection) => onSelectLayer(layer.id, addToSelection)}
                                    onUpdateLayer={(updates) => onUpdateLayer(layer.id, updates)}
                                    viewMode={viewMode}
                                    containerWidth={width}
                                    containerHeight={height}
                                    groupDragDelta={
                                        draggingLayerId &&
                                            selectedLayerIds.includes(draggingLayerId) &&
                                            selectedLayerIds.length > 1 &&
                                            layer.id !== draggingLayerId
                                            ? currentDragDelta
                                            : null
                                    }
                                    allLayers={slide.layers}
                                    onSelectLayerById={onSelectLayer}
                                    zoom={zoom}
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
                    <Typography variant="caption" sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 600,
                        backgroundColor: viewMode === 'desktop' ? 'rgba(0, 212, 255, 0.2)' :
                            viewMode === 'tablet' ? 'rgba(124, 58, 237, 0.3)' :
                                'rgba(16, 185, 129, 0.3)',
                        px: 1,
                        py: 0.25,
                        borderRadius: 0.5
                    }}>
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
