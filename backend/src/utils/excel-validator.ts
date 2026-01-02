import mongoose from 'mongoose';

/**
 * Validate if a value is a valid MongoDB ObjectId
 */
export const validateObjectId = (value: any): boolean => {
    if (!value) return false;

    // Check if it's already an ObjectId
    if (value instanceof mongoose.Types.ObjectId) return true;

    // Check if it's a valid ObjectId string
    if (typeof value === 'string') {
        return mongoose.Types.ObjectId.isValid(value);
    }

    return false;
};

/**
 * Validate required fields in a row
 */
export const validateRequiredFields = (row: any, requiredFields: string[]): string[] => {
    const errors: string[] = [];

    for (const field of requiredFields) {
        if (row[field] === undefined || row[field] === null || row[field] === '') {
            errors.push(`Missing required field: ${field}`);
        }
    }

    return errors;
};

/**
 * Validate data types based on schema
 * Schema format: { fieldName: 'string' | 'number' | 'boolean' | 'date' | 'objectid' | 'array' }
 */
export const validateDataTypes = (row: any, schema: Record<string, string>): string[] => {
    const errors: string[] = [];

    for (const [field, expectedType] of Object.entries(schema)) {
        const value = row[field];

        // Skip validation if value is empty (handled by required fields check)
        if (value === undefined || value === null || value === '') continue;

        switch (expectedType) {
            case 'string':
                if (typeof value !== 'string') {
                    errors.push(`Field '${field}' must be a string`);
                }
                break;
            case 'number':
                if (typeof value !== 'number' && isNaN(Number(value))) {
                    errors.push(`Field '${field}' must be a number`);
                }
                break;
            case 'boolean':
                // Accept: true/false, 1/0, "true"/"false", "yes"/"no", "Yes"/"No"
                if (typeof value === 'boolean') break;
                if (typeof value === 'number' && (value === 0 || value === 1)) break;
                if (typeof value === 'string') {
                    const lower = value.toLowerCase().trim();
                    if (lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no' || lower === '1' || lower === '0') {
                        break;
                    }
                }
                errors.push(`Field '${field}' must be a boolean (true/false, yes/no, 1/0)`);
                break;
            case 'date':
                if (!(value instanceof Date) && isNaN(Date.parse(value))) {
                    errors.push(`Field '${field}' must be a valid date`);
                }
                break;
            case 'objectid':
                if (!validateObjectId(value)) {
                    errors.push(`Field '${field}' must be a valid ObjectId`);
                }
                break;
            case 'array':
                if (!Array.isArray(value)) {
                    // Try to parse as JSON array
                    try {
                        const parsed = JSON.parse(value);
                        if (!Array.isArray(parsed)) {
                            errors.push(`Field '${field}' must be an array`);
                        }
                    } catch (e) {
                        errors.push(`Field '${field}' must be an array`);
                    }
                }
                break;
        }
    }

    return errors;
};

/**
 * Validate foreign key references
 * References format: { fieldName: ModelName }
 */
export const validateReferences = async (
    row: any,
    references: Record<string, any>
): Promise<string[]> => {
    const errors: string[] = [];

    for (const [field, Model] of Object.entries(references)) {
        const value = row[field];

        // Skip if value is empty
        if (!value) continue;

        // Validate ObjectId format first
        if (!validateObjectId(value)) {
            errors.push(`Field '${field}' has invalid ObjectId format`);
            continue;
        }

        // Check if reference exists
        try {
            const exists = await Model.exists({ _id: value });
            if (!exists) {
                errors.push(`Field '${field}': Referenced document not found`);
            }
        } catch (error) {
            errors.push(`Field '${field}': Error validating reference - ${error}`);
        }
    }

    return errors;
};

/**
 * Sanitize and clean input data
 */
export const sanitizeData = (row: any): any => {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(row)) {
        // Skip empty keys
        if (!key) continue;

        // Handle different value types
        if (value === null || value === undefined || value === '') {
            sanitized[key] = undefined;
        } else if (typeof value === 'string') {
            // Trim strings
            sanitized[key] = value.trim();
        } else if (typeof value === 'number') {
            sanitized[key] = value;
        } else if (typeof value === 'boolean') {
            sanitized[key] = value;
        } else if (value instanceof Date) {
            sanitized[key] = value;
        } else if (Array.isArray(value)) {
            sanitized[key] = value;
        } else if (typeof value === 'object') {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeData(value);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
};

/**
 * Parse boolean values from Excel
 */
export const parseBoolean = (value: any): boolean => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const lower = value.toLowerCase().trim();
        return lower === 'true' || lower === 'yes' || lower === '1';
    }
    return false;
};

/**
 * Parse array values from Excel (JSON string or comma-separated)
 */
export const parseArray = (value: any): any[] => {
    if (Array.isArray(value)) return value;

    if (typeof value === 'string') {
        // Try JSON parse first
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
        } catch (e) {
            // Fall back to comma-separated
            return value.split(',').map(item => item.trim()).filter(item => item);
        }
    }

    return [];
};

/**
 * Convert Excel row to database object
 */
export const excelRowToObject = (row: any, schema: any): any => {
    const obj: any = {};

    for (const [key, config] of Object.entries(schema)) {
        const value = row[key];

        if (value === undefined || value === null || value === '') continue;

        const type = (config as any).type;

        switch (type) {
            case 'boolean':
                obj[key] = parseBoolean(value);
                break;
            case 'array':
                obj[key] = parseArray(value);
                break;
            case 'number':
                obj[key] = Number(value);
                break;
            case 'date':
                obj[key] = value instanceof Date ? value : new Date(value);
                break;
            case 'objectid':
                obj[key] = new mongoose.Types.ObjectId(value);
                break;
            default:
                obj[key] = value;
        }
    }

    return obj;
};
