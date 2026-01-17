import React from 'react';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, MenuItem, Select, FormControl, InputLabel, Slider, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { HeroSliderLayer, HeroSliderSlide, SectionLayout } from '@/services/heroSlider.service';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import IconPicker from '@/components/atoms/IconPicker';
import { ColorPicker } from '@/components/atoms';

// Theme colors
const colors = {
    bg: '#0d0d1a',
    bgSecondary: '#13132a',
    bgTertiary: '#1a1a3a',
    border: '#2a2a4a',
    text: '#ffffff',
    textSecondary: 'rgba(255,255,255,0.5)',
    accent: '#00d4ff',
    accent2: '#7c3aed'
};

import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

// Tiptap imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';

// Simple Tiptap Editor Component
const TiptapEditor = ({ content, onChange }: { content: string; onChange: (html: string) => void }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            TextStyle,
            Color,
            Underline,
            Link.configure({ openOnClick: false })
        ],
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                style: `min-height: 100px; padding: 8px; background-color: ${colors.bgTertiary}; color: ${colors.text}; border-radius: 4px; outline: none; border: 1px solid ${colors.border}; font-size: 13px;`
            }
        },
        immediatelyRender: false
    });

    React.useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // Only update if content is significantly different to avoid cursor jumping
            // For simple integration, we might skip this or handle it carefully.
            // editor.commands.setContent(content);
        }
    }, [content, editor]);

    return (
        <Box sx={{
            '& .ProseMirror': {
                '&:hover': { borderColor: colors.accent },
                '&:focus': { borderColor: colors.accent }
            }
        }}>
            <EditorContent editor={editor} />
        </Box>
    );
};

// Styled components
const StyledAccordion = ({ children, defaultExpanded = false }: { children: NonNullable<React.ReactNode>; defaultExpanded?: boolean }) => (
    <Accordion
        defaultExpanded={defaultExpanded}
        elevation={0}
        disableGutters
        sx={{
            backgroundColor: 'transparent',
            '&:before': { display: 'none' },
            '& .MuiAccordionSummary-root': {
                minHeight: 40,
                px: 1.5,
                backgroundColor: colors.bgTertiary,
                borderRadius: 1,
                mb: 0.5,
                '&:hover': { backgroundColor: alpha(colors.accent, 0.1) }
            },
            '& .MuiAccordionSummary-content': {
                my: 0.5
            },
            '& .MuiAccordionDetails-root': {
                px: 0,
                pt: 1,
                pb: 2
            }
        }}
    >
        {children}
    </Accordion>
);

const StyledTextField = (props: any) => (
    <TextField
        {...props}
        fullWidth
        size="small"
        sx={{
            '& .MuiOutlinedInput-root': {
                backgroundColor: colors.bgTertiary,
                color: colors.text,
                fontSize: 13,
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.accent },
                '&.Mui-focused fieldset': { borderColor: colors.accent }
            },
            '& .MuiOutlinedInput-input': {
                color: colors.text,
                '&::placeholder': { color: colors.textSecondary, opacity: 1 }
            },
            '& .MuiInputLabel-root': { color: colors.textSecondary, fontSize: 12 },
            '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
            ...props.sx
        }}
        InputProps={{
            ...props.InputProps,
            style: { color: colors.text, ...props.InputProps?.style }
        }}
    />
);

const StyledSelect = (props: any) => (
    <Select
        {...props}
        size="small"
        sx={{
            backgroundColor: colors.bgTertiary,
            color: colors.text,
            fontSize: 13,
            '& .MuiOutlinedInput-notchedOutline': { borderColor: colors.border },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.accent },
            '& .MuiSvgIcon-root': { color: colors.textSecondary },
            ...props.sx
        }}
        MenuProps={{
            PaperProps: {
                sx: {
                    bgcolor: colors.bgSecondary,
                    border: `1px solid ${colors.border}`,
                    '& .MuiMenuItem-root': {
                        color: colors.text,
                        fontSize: 12,
                        '&:hover': { bgcolor: alpha(colors.accent, 0.1) },
                        '&.Mui-selected': { bgcolor: alpha(colors.accent, 0.2) }
                    }
                }
            }
        }}
    />
);



interface LayerPropertiesProps {
    layer?: HeroSliderLayer;
    slide?: HeroSliderSlide;
    onUpdateLayer: (id: string, updates: Partial<HeroSliderLayer>) => void;
    onUpdateSlide: (updates: Partial<HeroSliderSlide>) => void;
    viewMode?: 'desktop' | 'tablet' | 'mobile';
}

export default function LayerProperties({ layer, slide, onUpdateLayer, onUpdateSlide, viewMode = 'desktop' }: LayerPropertiesProps) {
    // Helper to get effective style for current viewMode
    const getEffectiveStyle = () => {
        if (!layer) return {};
        if (viewMode === 'tablet' && layer.tabletStyle) {
            return { ...layer.style, ...layer.tabletStyle };
        }
        if (viewMode === 'mobile' && layer.mobileStyle) {
            return { ...layer.style, ...layer.mobileStyle };
        }
        return layer.style || {};
    };

    // Helper to update style based on viewMode
    const updateStyle = (styleUpdates: any) => {
        if (!layer) return;
        if (viewMode === 'desktop') {
            onUpdateLayer(layer.id, { style: { ...layer.style, ...styleUpdates } });
        } else if (viewMode === 'tablet') {
            onUpdateLayer(layer.id, { tabletStyle: { ...(layer.tabletStyle || {}), ...styleUpdates } });
        } else if (viewMode === 'mobile') {
            onUpdateLayer(layer.id, { mobileStyle: { ...(layer.mobileStyle || {}), ...styleUpdates } });
        }
    };

    // Helper to get effective visibility for current viewMode
    const getEffectiveVisibility = () => {
        if (!layer) return true;
        if (viewMode === 'tablet' && layer.tabletVisible !== undefined) {
            return layer.tabletVisible;
        }
        if (viewMode === 'mobile' && layer.mobileVisible !== undefined) {
            return layer.mobileVisible;
        }
        return layer.visible !== false;
    };

    // Helper to update visibility based on viewMode
    const updateVisibility = (visible: boolean) => {
        if (!layer) return;
        if (viewMode === 'desktop') {
            onUpdateLayer(layer.id, { visible });
        } else if (viewMode === 'tablet') {
            onUpdateLayer(layer.id, { tabletVisible: visible });
        } else if (viewMode === 'mobile') {
            onUpdateLayer(layer.id, { mobileVisible: visible });
        }
    };

    // Helper to get effective position for current viewMode
    const getEffectivePosition = () => {
        if (!layer) return { x: 0, y: 0 };
        if (viewMode === 'mobile' && layer.mobilePosition) {
            return layer.mobilePosition;
        }
        if (viewMode === 'tablet' && layer.tabletPosition) {
            return layer.tabletPosition;
        }
        return layer.position || { x: 0, y: 0 };
    };

    // Helper to update position based on viewMode
    const updatePosition = (posUpdates: { x?: number; y?: number }) => {
        if (!layer) return;
        const currentPos = getEffectivePosition();
        const newPos = { ...currentPos, ...posUpdates };

        if (viewMode === 'desktop') {
            onUpdateLayer(layer.id, { position: newPos });
        } else if (viewMode === 'tablet') {
            onUpdateLayer(layer.id, { tabletPosition: newPos });
        } else if (viewMode === 'mobile') {
            onUpdateLayer(layer.id, { mobilePosition: newPos });
        }
    };

    // Helper to update section layout
    const updateSectionLayout = (updates: Partial<SectionLayout>) => {
        if (!layer || !layer.sectionLayout) return;
        onUpdateLayer(layer.id, {
            sectionLayout: { ...layer.sectionLayout, ...updates }
        });
    };

    const effectiveStyle = getEffectiveStyle();
    const effectivePosition = getEffectivePosition();

    if (!slide) {
        return (
            <Box sx={{ p: 2, color: colors.textSecondary, textAlign: 'center' }}>
                <Typography variant="body2">No slide selected</Typography>
            </Box>
        );
    }

    // Slide Properties
    if (!layer) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, mb: 2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Slide Settings
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Slide Name */}
                    <StyledTextField
                        label="Slide Name"
                        value={slide.name || ''}
                        placeholder="Untitled Slide"
                        onChange={(e: any) => onUpdateSlide({ name: e.target.value })}
                    />

                    {/* Background Type */}
                    <FormControl fullWidth size="small">
                        <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>Background</InputLabel>
                        <StyledSelect
                            label="Background"
                            value={slide.background?.type || 'color'}
                            onChange={(e: any) => onUpdateSlide({ background: { ...slide.background, type: e.target.value } })}
                        >
                            <MenuItem value="color">Solid Color</MenuItem>
                            <MenuItem value="image">Image</MenuItem>
                        </StyledSelect>
                    </FormControl>

                    {slide.background?.type === 'color' && (
                        <ColorPicker
                            label="Background Color"
                            value={slide.background?.value || '#1a1a2e'}
                            onChange={(val) => onUpdateSlide({ background: { ...slide.background, value: val } })}
                        />
                    )}

                    {slide.background?.type === 'image' && (
                        <Box>
                            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11, display: 'block', mb: 1 }}>
                                Background Image
                            </Typography>
                            <FileManagerButton
                                onSelect={(files) => {
                                    if (files.length > 0) onUpdateSlide({ background: { ...slide.background, value: files[0].url } });
                                }}
                                label={slide.background?.value ? 'Change Image' : 'Select Image'}
                                fullWidth
                                size="small"
                            />
                            {slide.background?.value && (
                                <Box
                                    component="img"
                                    src={slide.background.value}
                                    sx={{ width: '100%', borderRadius: 1, mt: 1, maxHeight: 100, objectFit: 'cover' }}
                                />
                            )}
                        </Box>
                    )}

                    <ColorPicker
                        label="Overlay Color"
                        value={slide.background?.overlay || 'rgba(0,0,0,0)'}
                        onChange={(val) => onUpdateSlide({ background: { ...slide.background, overlay: val } })}
                    />

                    <Box>
                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                            Overlay Opacity: {Math.round((slide.background?.overlayOpacity ?? 0.5) * 100)}%
                        </Typography>
                        <Slider
                            min={0} max={1} step={0.05}
                            value={slide.background?.overlayOpacity ?? 0.5}
                            onChange={(_, v) => onUpdateSlide({ background: { ...slide.background, overlayOpacity: v as number } })}
                            sx={{ color: colors.accent }}
                        />
                    </Box>

                    <StyledTextField
                        label="Duration (ms)"
                        type="number"
                        value={slide.settings?.duration || 5000}
                        onChange={(e: any) => onUpdateSlide({ settings: { ...slide.settings, duration: parseInt(e.target.value) } })}
                    />
                </Box>
            </Box>
        );
    }

    // Layer Properties
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ color: colors.text, fontWeight: 600, mb: 2, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Layer Properties
            </Typography>

            {/* Layer Name */}
            <Box sx={{ mb: 2 }}>
                <StyledTextField
                    label="Layer Name"
                    value={layer.name || ''}
                    placeholder={layer.type ? layer.type.charAt(0).toUpperCase() + layer.type.slice(1) : 'Layer'}
                    onChange={(e: any) => onUpdateLayer(layer.id, { name: e.target.value })}
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Content */}
                <StyledAccordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Content</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {layer.type === 'text' && (
                                <StyledTextField
                                    label="Text Content"
                                    multiline
                                    rows={3}
                                    value={layer.content || ''}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { content: e.target.value })}
                                />
                            )}
                            {layer.type === 'rte' && (
                                <TiptapEditor
                                    content={layer.content || ''}
                                    onChange={(html) => onUpdateLayer(layer.id, { content: html })}
                                />
                            )}
                            {layer.type === 'button' && (
                                <>
                                    <StyledTextField
                                        label="Button Label"
                                        value={layer.content || ''}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { content: e.target.value })}
                                    />
                                    <StyledTextField
                                        label="Link URL"
                                        value={effectiveStyle?.href || ''}
                                        onChange={(e: any) => updateStyle({ href: e.target.value })}
                                    />
                                </>
                            )}
                            {layer.type === 'image' && (
                                <Box>
                                    <FileManagerButton
                                        onSelect={(files) => {
                                            if (files.length > 0) onUpdateLayer(layer.id, { content: files[0].url });
                                        }}
                                        label={layer.content ? 'Change Image' : 'Select Image'}
                                        fullWidth
                                        size="small"
                                    />
                                    {layer.content && (
                                        <Box
                                            component="img"
                                            src={layer.content}
                                            sx={{ width: '100%', borderRadius: 1, mt: 1, maxHeight: 100, objectFit: 'cover' }}
                                        />
                                    )}
                                </Box>
                            )}
                            {layer.type === 'icon' && (
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    '& .MuiTextField-root': {
                                        '& .MuiOutlinedInput-root': {
                                            backgroundColor: colors.bgTertiary,
                                            color: colors.text,
                                            '& fieldset': { borderColor: colors.border },
                                            '&:hover fieldset': { borderColor: colors.accent }
                                        }
                                    },
                                    '& .MuiButton-root': {
                                        color: colors.accent
                                    }
                                }}>
                                    <IconPicker
                                        value={layer.content || ''}
                                        onChange={(icon) => onUpdateLayer(layer.id, { content: icon })}
                                        fullWidth
                                    />
                                    {/* Icon Size */}
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 0.5, display: 'block' }}>
                                            Icon Size: {effectiveStyle?.fontSize || 24}px
                                        </Typography>
                                        <Slider
                                            size="small"
                                            value={Number.parseInt(effectiveStyle?.fontSize) || 24}
                                            min={12}
                                            max={200}
                                            onChange={(_, v) => updateStyle({ fontSize: `${v}px` })}
                                            sx={{ color: colors.accent }}
                                        />
                                    </Box>
                                    {/* Icon Color */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ColorPicker
                                            label="Color"
                                            value={effectiveStyle?.color || '#000000'}
                                            onChange={(val) => updateStyle({ color: val })}
                                            fullWidth
                                        />
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Section Layout Settings */}
                {layer.type === 'section' && layer.sectionLayout && (
                    <StyledAccordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                            <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Section Layout</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Columns */}
                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ color: colors.textSecondary }}>Desktop Columns</InputLabel>
                                    <Select
                                        value={layer.sectionLayout.columns}
                                        label="Desktop Columns"
                                        onChange={(e) => updateSectionLayout({ columns: Number(e.target.value) })}
                                        sx={{ color: colors.text, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
                                    >
                                        {[1, 2, 3, 4, 5, 6].map(n => (
                                            <MenuItem key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ color: colors.textSecondary }}>Tablet Columns</InputLabel>
                                    <Select
                                        value={layer.sectionLayout.tabletColumns ?? layer.sectionLayout.columns}
                                        label="Tablet Columns"
                                        onChange={(e) => updateSectionLayout({ tabletColumns: Number(e.target.value) })}
                                        sx={{ color: colors.text, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
                                    >
                                        {[1, 2, 3, 4].map(n => (
                                            <MenuItem key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ color: colors.textSecondary }}>Mobile Columns</InputLabel>
                                    <Select
                                        value={layer.sectionLayout.mobileColumns ?? 1}
                                        label="Mobile Columns"
                                        onChange={(e) => updateSectionLayout({ mobileColumns: Number(e.target.value) })}
                                        sx={{ color: colors.text, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
                                    >
                                        {[1, 2].map(n => (
                                            <MenuItem key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {/* Gap */}
                                <Box>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                        Gap: {layer.sectionLayout.gap}px
                                    </Typography>
                                    <Slider
                                        min={0} max={64} step={4}
                                        value={layer.sectionLayout.gap}
                                        onChange={(_, v) => updateSectionLayout({ gap: v as number })}
                                        sx={{ color: colors.accent2 }}
                                    />
                                </Box>

                                {/* Alignment */}
                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ color: colors.textSecondary }}>Alignment</InputLabel>
                                    <Select
                                        value={layer.sectionLayout.alignment}
                                        label="Alignment"
                                        onChange={(e) => updateSectionLayout({ alignment: e.target.value as any })}
                                        sx={{ color: colors.text, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
                                    >
                                        <MenuItem value="start">Start</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="end">End</MenuItem>
                                        <MenuItem value="stretch">Stretch</MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControl size="small" fullWidth>
                                    <InputLabel sx={{ color: colors.textSecondary }}>Justify</InputLabel>
                                    <Select
                                        value={layer.sectionLayout.justify}
                                        label="Justify"
                                        onChange={(e) => updateSectionLayout({ justify: e.target.value as any })}
                                        sx={{ color: colors.text, '.MuiOutlinedInput-notchedOutline': { borderColor: colors.border } }}
                                    >
                                        <MenuItem value="start">Start</MenuItem>
                                        <MenuItem value="center">Center</MenuItem>
                                        <MenuItem value="end">End</MenuItem>
                                        <MenuItem value="space-between">Space Between</MenuItem>
                                        <MenuItem value="space-around">Space Around</MenuItem>
                                        <MenuItem value="space-evenly">Space Evenly</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </AccordionDetails>
                    </StyledAccordion>
                )}

                {/* Position & Transform */}
                <StyledAccordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Position & Transform</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    X: {(effectivePosition.x || 0).toFixed(1)}%
                                </Typography>
                                <Slider
                                    min={0} max={100} step={0.5}
                                    value={effectivePosition.x || 0}
                                    onChange={(_, v) => updatePosition({ x: v as number })}
                                    sx={{ color: colors.accent }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    Y: {(effectivePosition.y || 0).toFixed(1)}%
                                </Typography>
                                <Slider
                                    min={0} max={100} step={0.5}
                                    value={effectivePosition.y || 0}
                                    onChange={(_, v) => updatePosition({ y: v as number })}
                                    sx={{ color: colors.accent }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    Rotation: {layer.rotation || 0}°
                                </Typography>
                                <Slider
                                    min={0} max={360}
                                    value={layer.rotation || 0}
                                    onChange={(_, v) => onUpdateLayer(layer.id, { rotation: v as number })}
                                    sx={{ color: colors.accent2 }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    Opacity: {Math.round((layer.opacity ?? 1) * 100)}%
                                </Typography>
                                <Slider
                                    min={0} max={1} step={0.05}
                                    value={layer.opacity ?? 1}
                                    onChange={(_, v) => onUpdateLayer(layer.id, { opacity: v as number })}
                                    sx={{ color: colors.accent }}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Typography */}
                {(layer.type === 'text' || layer.type === 'button' || layer.type === 'rte') && (
                    <StyledAccordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                            <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Typography</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Typography Alignment */}
                                {(layer.type === 'text' || layer.type === 'rte') && (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11, display: 'block', mb: 0.5 }}>
                                            Alignment
                                        </Typography>
                                        <ToggleButtonGroup
                                            value={effectiveStyle?.textAlign || 'left'}
                                            exclusive
                                            onChange={(_, val) => val && updateStyle({ textAlign: val })}
                                            size="small"
                                            fullWidth
                                            sx={{
                                                '& .MuiToggleButton-root': {
                                                    borderColor: colors.border,
                                                    color: colors.textSecondary,
                                                    '&.Mui-selected': {
                                                        backgroundColor: alpha(colors.accent, 0.15),
                                                        color: colors.accent,
                                                        borderColor: colors.accent
                                                    },
                                                    '&:hover': {
                                                        backgroundColor: alpha(colors.accent, 0.05)
                                                    }
                                                }
                                            }}
                                        >
                                            <ToggleButton value="left"><FormatAlignLeftIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="center"><FormatAlignCenterIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="right"><FormatAlignRightIcon fontSize="small" /></ToggleButton>
                                            <ToggleButton value="justify"><FormatAlignJustifyIcon fontSize="small" /></ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                )}

                                <Box>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                        Font Size: {effectiveStyle?.fontSize || 16}px
                                    </Typography>
                                    <Slider
                                        min={10} max={100}
                                        value={parseInt(effectiveStyle?.fontSize) || 16}
                                        onChange={(_, v) => updateStyle({ fontSize: v })}
                                        sx={{ color: colors.accent }}
                                    />
                                </Box>

                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>Font Family</InputLabel>
                                    <StyledSelect
                                        label="Font Family"
                                        value={effectiveStyle?.fontFamily || 'Inter'}
                                        onChange={(e: any) => updateStyle({ fontFamily: e.target.value })}
                                    >
                                        <MenuItem value="Inter">Inter</MenuItem>
                                        <MenuItem value="Roboto">Roboto</MenuItem>
                                        <MenuItem value="Open Sans">Open Sans</MenuItem>
                                        <MenuItem value="Lato">Lato</MenuItem>
                                        <MenuItem value="Montserrat">Montserrat</MenuItem>
                                        <MenuItem value="Poppins">Poppins</MenuItem>
                                        <MenuItem value="Playfair Display">Playfair Display</MenuItem>
                                    </StyledSelect>
                                </FormControl>

                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>Font Weight</InputLabel>
                                    <StyledSelect
                                        label="Font Weight"
                                        value={effectiveStyle?.fontWeight || '400'}
                                        onChange={(e: any) => updateStyle({ fontWeight: e.target.value })}
                                    >
                                        <MenuItem value="300">Light</MenuItem>
                                        <MenuItem value="400">Regular</MenuItem>
                                        <MenuItem value="500">Medium</MenuItem>
                                        <MenuItem value="600">Semi Bold</MenuItem>
                                        <MenuItem value="700">Bold</MenuItem>
                                        <MenuItem value="800">Extra Bold</MenuItem>
                                    </StyledSelect>
                                </FormControl>

                                <ColorPicker
                                    label="Text Color"
                                    value={effectiveStyle?.color || '#ffffff'}
                                    onChange={(val) => updateStyle({ color: val })}
                                />

                                <ColorPicker
                                    label="Background Color"
                                    value={effectiveStyle?.backgroundColor || 'transparent'}
                                    onChange={(val) => updateStyle({ backgroundColor: val })}
                                />

                                <StyledTextField
                                    label="Padding"
                                    value={effectiveStyle?.padding || ''}
                                    placeholder="e.g., 10px 20px"
                                    onChange={(e: any) => updateStyle({ padding: e.target.value })}
                                />
                            </Box>
                        </AccordionDetails>
                    </StyledAccordion>
                )}

                {/* Size */}
                <StyledAccordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Size</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <StyledTextField
                                label="Width"
                                value={effectiveStyle?.width || ''}
                                placeholder="auto"
                                onChange={(e: any) => updateStyle({ width: e.target.value })}
                            />
                            <StyledTextField
                                label="Height"
                                value={effectiveStyle?.height || ''}
                                placeholder="auto"
                                onChange={(e: any) => updateStyle({ height: e.target.value })}
                            />
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Border */}
                <StyledAccordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Border</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>Style</InputLabel>
                                <StyledSelect
                                    label="Style"
                                    value={layer.border?.style || 'none'}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { border: { ...layer.border, style: e.target.value } })}
                                >
                                    <MenuItem value="none">None</MenuItem>
                                    <MenuItem value="solid">Solid</MenuItem>
                                    <MenuItem value="dashed">Dashed</MenuItem>
                                    <MenuItem value="dotted">Dotted</MenuItem>
                                </StyledSelect>
                            </FormControl>

                            {layer.border?.style !== 'none' && (
                                <>
                                    <ColorPicker
                                        label="Border Color"
                                        value={layer.border?.color || '#000000'}
                                        onChange={(val) => onUpdateLayer(layer.id, { border: { ...layer.border, color: val } })}
                                    />
                                    <StyledTextField
                                        label="Border Width (px)"
                                        type="number"
                                        value={layer.border?.width || 1}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { border: { ...layer.border, width: parseInt(e.target.value) } })}
                                    />
                                    <StyledTextField
                                        label="Border Radius (px)"
                                        type="number"
                                        value={layer.border?.radius || 0}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { border: { ...layer.border, radius: parseInt(e.target.value) } })}
                                    />
                                </>
                            )}
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Shadow */}
                <StyledAccordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Shadow</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <ColorPicker
                                label="Shadow Color"
                                value={layer.shadow?.color || 'rgba(0,0,0,0.5)'}
                                onChange={(val) => onUpdateLayer(layer.id, { shadow: { ...layer.shadow, color: val } })}
                            />
                            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                <StyledTextField
                                    label="X Offset"
                                    type="number"
                                    value={layer.shadow?.x || 0}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { shadow: { ...layer.shadow, x: parseInt(e.target.value) } })}
                                />
                                <StyledTextField
                                    label="Y Offset"
                                    type="number"
                                    value={layer.shadow?.y || 0}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { shadow: { ...layer.shadow, y: parseInt(e.target.value) } })}
                                />
                                <StyledTextField
                                    label="Blur"
                                    type="number"
                                    value={layer.shadow?.blur || 0}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { shadow: { ...layer.shadow, blur: parseInt(e.target.value) } })}
                                />
                                <StyledTextField
                                    label="Spread"
                                    type="number"
                                    value={layer.shadow?.spread || 0}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { shadow: { ...layer.shadow, spread: parseInt(e.target.value) } })}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Animation */}
                <StyledAccordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Animation</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>In Animation</InputLabel>
                                <StyledSelect
                                    label="In Animation"
                                    value={layer.animation?.in || 'fadeIn'}
                                    onChange={(e: any) => onUpdateLayer(layer.id, { animation: { ...layer.animation, in: e.target.value } })}
                                >
                                    <MenuItem value="fadeIn">Fade In</MenuItem>
                                    <MenuItem value="fadeInUp">Fade In Up</MenuItem>
                                    <MenuItem value="fadeInDown">Fade In Down</MenuItem>
                                    <MenuItem value="fadeInLeft">Fade In Left</MenuItem>
                                    <MenuItem value="fadeInRight">Fade In Right</MenuItem>
                                    <MenuItem value="zoomIn">Zoom In</MenuItem>
                                    <MenuItem value="bounceIn">Bounce In</MenuItem>
                                </StyledSelect>
                            </FormControl>

                            <StyledTextField
                                label="Delay (ms)"
                                type="number"
                                value={layer.animation?.delay || 0}
                                onChange={(e: any) => onUpdateLayer(layer.id, { animation: { ...layer.animation, delay: parseInt(e.target.value) } })}
                            />

                            <StyledTextField
                                label="Duration (ms)"
                                type="number"
                                value={layer.animation?.duration || 800}
                                onChange={(e: any) => onUpdateLayer(layer.id, { animation: { ...layer.animation, duration: parseInt(e.target.value) } })}
                            />
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>
            </Box>
        </Box>
    );
}
