import React from 'react';
import { MuiColorInput } from 'mui-color-input';
import { Box } from '@mui/material';

interface ColorPickerProps {
    value?: string;
    onChange: (value: string) => void;
    label?: string;
    helperText?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    size?: 'small' | 'medium';
    error?: boolean;
}

export const ColorPicker = ({
    value,
    onChange,
    label,
    helperText,
    disabled = false,
    fullWidth = true,
    size = 'small',
    error = false
}: ColorPickerProps) => {
    // Ensure value is a string, fallback to transparent or black if undefined
    const safeValue = value || '#000000';

    return (
        <MuiColorInput
            value={safeValue}
            onChange={onChange}
            format="hex8"
            label={label}
            helperText={helperText}
            disabled={disabled}
            isAlphaHidden={false}
            fullWidth={fullWidth}
            size={size}
            error={error}
            fallbackValue="#000000"
            sx={{
                '& .MuiInputBase-root': {
                    backgroundColor: 'background.paper',
                }
            }}
        />
    );
};

export default ColorPicker;
