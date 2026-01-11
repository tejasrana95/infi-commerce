/**
 * Formats a font family name for use in CSS styles.
 * Adds single quotes around the font name if not already present,
 * and appends a generic fallback (sans-serif) for resilience.
 * Useful for Safari compatibility with Google Fonts that have spaces.
 * 
 * @param font The font family name to format
 * @returns The formatted font-family string
 */
export function formatFontFamily(font?: string): string | undefined {
    if (!font) return undefined;

    // If it already has quotes or is a system stack, return as is
    if (font.includes("'") || font.includes('"') || font.includes(',')) {
        return font;
    }

    // Wrap in single quotes and add fallback
    return `'${font}', sans-serif`;
}
