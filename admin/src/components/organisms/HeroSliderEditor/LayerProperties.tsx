import React from 'react';
import { Box, Typography, TextField, Accordion, AccordionSummary, AccordionDetails, MenuItem, Select, FormControl, InputLabel, Slider, alpha } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { HeroSliderLayer, HeroSliderSlide } from '@/services/heroSlider.service';
import FileManagerButton from '@/components/molecules/FileManagerButton';
import IconPicker from '@/components/atoms/IconPicker';

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

const ColorInput = ({ value, onChange, label }: { value: string; onChange: (val: string) => void; label: string }) => (
    <Box>
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11, display: 'block', mb: 0.5 }}>
            {label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: 32,
                    height: 32,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    backgroundColor: 'transparent'
                }}
            />
            <Typography variant="caption" sx={{ color: colors.text, fontSize: 11, fontFamily: 'monospace' }}>
                {value || '#000000'}
            </Typography>
        </Box>
    </Box>
);

interface LayerPropertiesProps {
    layer?: HeroSliderLayer;
    slide?: HeroSliderSlide;
    onUpdateLayer: (id: string, updates: Partial<HeroSliderLayer>) => void;
    onUpdateSlide: (updates: Partial<HeroSliderSlide>) => void;
}

export default function LayerProperties({ layer, slide, onUpdateLayer, onUpdateSlide }: LayerPropertiesProps) {
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
                        <ColorInput
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

                    <ColorInput
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
                    placeholder={layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
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
                            {layer.type === 'button' && (
                                <>
                                    <StyledTextField
                                        label="Button Label"
                                        value={layer.content || ''}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { content: e.target.value })}
                                    />
                                    <StyledTextField
                                        label="Link URL"
                                        value={layer.style?.href || ''}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, href: e.target.value } })}
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
                                </Box>
                            )}
                        </Box>
                    </AccordionDetails>
                </StyledAccordion>

                {/* Position & Transform */}
                <StyledAccordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Position & Transform</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    X: {(layer.position?.x || 0).toFixed(1)}%
                                </Typography>
                                <Slider
                                    min={0} max={100} step={0.5}
                                    value={layer.position?.x || 0}
                                    onChange={(_, v) => onUpdateLayer(layer.id, { position: { ...layer.position, x: v as number, y: layer.position?.y || 0 } })}
                                    sx={{ color: colors.accent }}
                                />
                            </Box>
                            <Box>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                    Y: {(layer.position?.y || 0).toFixed(1)}%
                                </Typography>
                                <Slider
                                    min={0} max={100} step={0.5}
                                    value={layer.position?.y || 0}
                                    onChange={(_, v) => onUpdateLayer(layer.id, { position: { ...layer.position, x: layer.position?.x || 0, y: v as number } })}
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
                {(layer.type === 'text' || layer.type === 'button') && (
                    <StyledAccordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: colors.textSecondary, fontSize: 18 }} />}>
                            <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500, fontSize: 12 }}>Typography</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                                        Font Size: {layer.style?.fontSize || 16}px
                                    </Typography>
                                    <Slider
                                        min={10} max={100}
                                        value={parseInt(layer.style?.fontSize) || 16}
                                        onChange={(_, v) => onUpdateLayer(layer.id, { style: { ...layer.style, fontSize: v } })}
                                        sx={{ color: colors.accent }}
                                    />
                                </Box>

                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ color: colors.textSecondary, fontSize: 12 }}>Font Family</InputLabel>
                                    <StyledSelect
                                        label="Font Family"
                                        value={layer.style?.fontFamily || 'Inter'}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, fontFamily: e.target.value } })}
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
                                        value={layer.style?.fontWeight || '400'}
                                        onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, fontWeight: e.target.value } })}
                                    >
                                        <MenuItem value="300">Light</MenuItem>
                                        <MenuItem value="400">Regular</MenuItem>
                                        <MenuItem value="500">Medium</MenuItem>
                                        <MenuItem value="600">Semi Bold</MenuItem>
                                        <MenuItem value="700">Bold</MenuItem>
                                        <MenuItem value="800">Extra Bold</MenuItem>
                                    </StyledSelect>
                                </FormControl>

                                <ColorInput
                                    label="Text Color"
                                    value={layer.style?.color || '#ffffff'}
                                    onChange={(val) => onUpdateLayer(layer.id, { style: { ...layer.style, color: val } })}
                                />

                                <ColorInput
                                    label="Background Color"
                                    value={layer.style?.backgroundColor || 'transparent'}
                                    onChange={(val) => onUpdateLayer(layer.id, { style: { ...layer.style, backgroundColor: val } })}
                                />

                                <StyledTextField
                                    label="Padding"
                                    value={layer.style?.padding || ''}
                                    placeholder="e.g., 10px 20px"
                                    onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, padding: e.target.value } })}
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
                                value={layer.style?.width || ''}
                                placeholder="auto"
                                onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, width: e.target.value } })}
                            />
                            <StyledTextField
                                label="Height"
                                value={layer.style?.height || ''}
                                placeholder="auto"
                                onChange={(e: any) => onUpdateLayer(layer.id, { style: { ...layer.style, height: e.target.value } })}
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
                                    <ColorInput
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
                            <ColorInput
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
