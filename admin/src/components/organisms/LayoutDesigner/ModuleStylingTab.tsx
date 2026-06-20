'use client';

import {
    Box,
    Divider,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import { ColorPicker } from '@/components/atoms';

// ── Types ────────────────────────────────────────────────────────────────────

type StylingValue = {
    className?: string;
    customCSS?: string;
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted';
    borderRadius?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    maxWidth?: number;
    boxShadow?: 'none' | 'small' | 'medium' | 'large';
    gap?: number;
};

type StylingValuePrimitive = string | number | undefined;

interface ModuleStylingTabProps {
    styling?: StylingValue;
    onChange: (key: string, value: StylingValuePrimitive) => void;
}

// ── Reusable number input (module-level — avoids "component during render") ──

interface CompactNumberFieldProps {
    label: string;
    value?: number;
    onChange: (value?: number) => void;
    min?: number;
    max?: number;
}

function CompactNumberField({
    label,
    value,
    onChange,
    min = 0,
    max,
}: CompactNumberFieldProps) {
    return (
        <TextField
            label={label}
            type="number"
            value={value ?? ''}
            onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                    onChange(undefined);
                    return;
                }
                const parsed = Number.parseInt(raw, 10);
                onChange(Number.isNaN(parsed) ? undefined : parsed);
            }}
            size="small"
            fullWidth
            slotProps={{ htmlInput: { min, max } }}
            sx={{ '& .MuiInputBase-root': { borderRadius: 1 } }}
        />
    );
}

// ── Shadow helper ────────────────────────────────────────────────────────────

const SHADOW_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
] as const;

function shadowLabel(styling: StylingValue): string {
    return styling.boxShadow || 'none';
}

// ── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
    return (
        <Typography
            variant="subtitle2"
            fontWeight={600}
            sx={{ mb: 1.5, color: 'text.primary' }}
        >
            {title}
        </Typography>
    );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ModuleStylingTab({ styling = {}, onChange }: ModuleStylingTabProps) {
    const set = (key: string, value: StylingValuePrimitive) => onChange(key, value);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* ── Colors ──────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <SectionHeader title="Colors" />

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
                    <ColorPicker
                        label="Background"
                        value={styling.backgroundColor || 'transparent'}
                        onChange={(c) => set('backgroundColor', c)}
                    />
                    <ColorPicker
                        label="Text"
                        value={styling.textColor || '#111827'}
                        onChange={(c) => set('textColor', c)}
                    />
                    <ColorPicker
                        label="Border"
                        value={styling.borderColor || '#e5e7eb'}
                        onChange={(c) => set('borderColor', c)}
                    />
                </Box>
            </Paper>

            {/* ── Border & Shadow ─────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <SectionHeader title="Border & Shadow" />

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Style</InputLabel>
                        <Select
                            label="Style"
                            value={styling.borderStyle || 'none'}
                            onChange={(e) => set('borderStyle', e.target.value)}
                        >
                            <MenuItem value="none">None</MenuItem>
                            <MenuItem value="solid">Solid</MenuItem>
                            <MenuItem value="dashed">Dashed</MenuItem>
                            <MenuItem value="dotted">Dotted</MenuItem>
                        </Select>
                    </FormControl>

                    <CompactNumberField
                        label="Width (px)"
                        value={styling.borderWidth}
                        onChange={(v) => set('borderWidth', v)}
                        min={0}
                        max={16}
                    />

                    <CompactNumberField
                        label="Radius (px)"
                        value={styling.borderRadius}
                        onChange={(v) => set('borderRadius', v)}
                        min={0}
                        max={48}
                    />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Shadow</InputLabel>
                        <Select
                            label="Shadow"
                            value={shadowLabel(styling)}
                            onChange={(e) => set('boxShadow', e.target.value)}
                        >
                            {SHADOW_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <CompactNumberField
                        label="Max Width (px)"
                        value={styling.maxWidth}
                        onChange={(v) => set('maxWidth', v)}
                        min={0}
                    />
                </Box>
            </Paper>

            {/* ── Spacing ─────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <SectionHeader title="Spacing" />

                {/* Margin */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Margin
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2.5 }}>
                    <CompactNumberField
                        label="Top"
                        value={styling.marginTop}
                        onChange={(v) => set('marginTop', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Right"
                        value={styling.marginRight}
                        onChange={(v) => set('marginRight', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Bottom"
                        value={styling.marginBottom}
                        onChange={(v) => set('marginBottom', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Left"
                        value={styling.marginLeft}
                        onChange={(v) => set('marginLeft', v)}
                        min={0}
                        max={80}
                    />
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Padding */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Padding
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5, mb: 2.5 }}>
                    <CompactNumberField
                        label="Top"
                        value={styling.paddingTop}
                        onChange={(v) => set('paddingTop', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Right"
                        value={styling.paddingRight}
                        onChange={(v) => set('paddingRight', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Bottom"
                        value={styling.paddingBottom}
                        onChange={(v) => set('paddingBottom', v)}
                        min={0}
                        max={80}
                    />
                    <CompactNumberField
                        label="Left"
                        value={styling.paddingLeft}
                        onChange={(v) => set('paddingLeft', v)}
                        min={0}
                        max={80}
                    />
                </Box>

                <Divider sx={{ mb: 2.5 }} />

                {/* Gap */}
                <Box sx={{ maxWidth: '25%' }}>
                    <CompactNumberField
                        label="Gap (px)"
                        value={styling.gap}
                        onChange={(v) => set('gap', v)}
                        min={0}
                        max={48}
                    />
                </Box>
            </Paper>

            {/* ── Advanced ────────────────────────────────────────────── */}
            <Paper variant="outlined" sx={{ p: 2.5 }}>
                <SectionHeader title="Advanced" />

                <TextField
                    label="CSS Class"
                    value={styling.className || ''}
                    onChange={(e) => set('className', e.target.value)}
                    fullWidth
                    size="small"
                    placeholder="custom-module-class"
                    sx={{ mb: 2 }}
                />

                <TextField
                    label="Custom CSS"
                    value={styling.customCSS || ''}
                    onChange={(e) => set('customCSS', e.target.value)}
                    fullWidth
                    size="small"
                    multiline
                    rows={4}
                    placeholder=".my-module { ... }"
                />
            </Paper>
        </Box>
    );
}