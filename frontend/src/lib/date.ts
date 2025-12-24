/**
 * Date Formatting Utilities
 * Lightweight moment.js-like date formatting functions
 */

type DateInput = Date | string | number | undefined | null;

/**
 * Parse input to Date object
 */
function parseDate(input: DateInput): Date {
    if (!input) return new Date();
    if (input instanceof Date) return input;
    return new Date(input);
}

/**
 * Format date to locale string
 * @param input - Date, string, or timestamp
 * @param format - 'short' | 'medium' | 'long' | 'full'
 * @param locale - Locale string (default: 'en-US')
 */
export function formatDate(
    input: DateInput,
    format: 'short' | 'medium' | 'long' | 'full' = 'medium',
    locale: string = 'en-US'
): string {
    const date = parseDate(input);

    const options: Record<string, Intl.DateTimeFormatOptions> = {
        short: { month: 'numeric', day: 'numeric', year: '2-digit' },
        medium: { month: 'short', day: 'numeric', year: 'numeric' },
        long: { month: 'long', day: 'numeric', year: 'numeric' },
        full: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    };

    return date.toLocaleDateString(locale, options[format]);
}

/**
 * Format time to locale string
 * @param input - Date, string, or timestamp
 * @param format - 'short' | 'medium'
 * @param locale - Locale string (default: 'en-US')
 */
export function formatTime(
    input: DateInput,
    format: 'short' | 'medium' = 'short',
    locale: string = 'en-US'
): string {
    const date = parseDate(input);

    const options: Record<string, Intl.DateTimeFormatOptions> = {
        short: { hour: 'numeric', minute: '2-digit' },
        medium: { hour: 'numeric', minute: '2-digit', second: '2-digit' },
    };

    return date.toLocaleTimeString(locale, options[format]);
}

/**
 * Format date and time combined
 * @param input - Date, string, or timestamp
 * @param dateFormat - Date format
 * @param timeFormat - Time format
 * @param locale - Locale string
 */
export function formatDateTime(
    input: DateInput,
    dateFormat: 'short' | 'medium' | 'long' = 'medium',
    timeFormat: 'short' | 'medium' = 'short',
    locale: string = 'en-US'
): string {
    return `${formatDate(input, dateFormat, locale)} at ${formatTime(input, timeFormat, locale)}`;
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param input - Date, string, or timestamp
 * @param locale - Locale string (default: 'en-US')
 */
export function formatRelative(input: DateInput, locale: string = 'en-US'): string {
    const date = parseDate(input);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    const diffMonth = Math.round(diffDay / 30);
    const diffYear = Math.round(diffDay / 365);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour');
    if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
    if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
    return rtf.format(diffYear, 'year');
}

/**
 * Format order date with status-appropriate display
 * Shows relative time for recent, full date for older
 */
export function formatOrderDate(input: DateInput): string {
    const date = parseDate(input);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
        return formatRelative(input);
    }
    return formatDate(input, 'long');
}
