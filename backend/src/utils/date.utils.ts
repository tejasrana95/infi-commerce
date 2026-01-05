import { DateTime } from 'luxon';

/**
 * Formats a UTC date to a specific timezone
 * @param date The date to format (Date object or string)
 * @param timezone The target timezone (e.g., 'America/New_York')
 * @returns Object containing formatted date string and timezone name
 */
export const formatWithTimezone = (date: Date | string, timezone: string = 'UTC') => {
    const dt = typeof date === 'string'
        ? DateTime.fromISO(date, { zone: 'utc' })
        : DateTime.fromJSDate(date, { zone: 'utc' });

    const converted = dt.setZone(timezone);

    return {
        formatted: converted.toFormat('yyyy-MM-dd HH:mm:ss'),
        iso: converted.toISO(),
        timezone: timezone,
        offset: converted.offsetNameShort,
    };
};

/**
 * Adds timezone-aware dates to an object (e.g., product)
 * @param obj The object to modify
 * @param timezone The target timezone
 * @param dateFields Array of field names to convert (default: ['createdAt', 'updatedAt'])
 */
export const addTimezoneAwareDates = (obj: any, timezone: string, dateFields: string[] = ['createdAt', 'updatedAt']) => {
    if (!obj || !timezone) return obj;

    dateFields.forEach(field => {
        if (obj[field]) {
            const result = formatWithTimezone(obj[field], timezone);
            obj[`${field}Local`] = result.formatted;
            obj[`${field}Timezone`] = result.timezone;
            obj[`${field}Offset`] = result.offset;
        }
    });

    return obj;
};
