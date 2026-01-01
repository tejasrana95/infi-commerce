import React from 'react';

interface HoneypotProps {
    name: string;
    onChange: (value: string) => void;
    value: string;
}

/**
 * Honeypot component to trick bots.
 * Renders a hidden input field that should remain empty.
 */
export default function Honeypot({ name, onChange, value }: HoneypotProps) {
    return (
        <div style={{ display: 'none' }} aria-hidden="true">
            <label htmlFor={name}>Leave this field empty</label>
            <input
                id={name}
                name={name}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
