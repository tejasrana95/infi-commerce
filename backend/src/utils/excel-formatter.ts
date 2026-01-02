import ExcelJS from 'exceljs';

/**
 * Flatten nested objects for Excel export
 * Converts { address: { city: 'NYC' } } to { 'address.city': 'NYC' }
 * Special handling for populated MongoDB references to preserve ObjectIds
 */
export const flattenObject = (obj: any, prefix = ''): any => {
    const flattened: any = {};

    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (value === null || value === undefined) {
            flattened[newKey] = '';
        } else if (value instanceof Date) {
            flattened[newKey] = formatDate(value);
        } else if (Array.isArray(value)) {
            // Known populated reference fields that should have IDs extracted
            const populatedReferenceFields = [
                'categoryIds', 'categories', 'brand', 'brands',
                'storeId', 'stores', 'customerId', 'customers',
                'productId', 'products', 'attributeId', 'attributes',
                'taxClassId', 'parentCategory'
            ];

            // Check if this field is a known populated reference
            const isKnownReference = populatedReferenceFields.some(field =>
                key.toLowerCase().includes(field.toLowerCase())
            );

            if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null && isKnownReference) {
                // Check if items have _id (confirming they're populated)
                if ('_id' in value[0]) {
                    // Array of populated references - extract just the IDs
                    flattened[newKey] = JSON.stringify(value.map(item => item._id?.toString() || item));
                } else {
                    // Not actually populated, keep full structure
                    flattened[newKey] = JSON.stringify(value);
                }
            } else {
                // Regular array or embedded documents - keep full structure
                flattened[newKey] = JSON.stringify(value);
            }
        } else if (typeof value === 'object' && !(value instanceof Date)) {
            // Check if it's a MongoDB ObjectId
            if (value.toString && value.toString().match(/^[a-f\d]{24}$/i)) {
                flattened[newKey] = value.toString();
            } else if ('_id' in value && value._id) {
                // This is a populated reference object (e.g., { _id: '...', name: '...' })
                // Store the ObjectId in the main field for import compatibility
                flattened[newKey] = value._id.toString();
                // Store additional fields with a suffix for human readability
                for (const [subKey, subValue] of Object.entries(value)) {
                    if (subKey !== '_id' && subKey !== '__v') {
                        flattened[`${newKey}_${subKey}`] = subValue;
                    }
                }
            } else {
                // Recursively flatten nested objects
                Object.assign(flattened, flattenObject(value, newKey));
            }
        } else {
            flattened[newKey] = value;
        }
    }

    return flattened;
};

/**
 * Format date for Excel export
 */
export const formatDate = (date: Date): string => {
    if (!date || !(date instanceof Date)) return '';
    return date.toISOString();
};

/**
 * Format currency for Excel
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
    if (typeof amount !== 'number') return '';
    return `${currency} ${amount.toFixed(2)}`;
};

/**
 * Apply consistent Excel styles to worksheet
 */
export const applyExcelStyles = (worksheet: ExcelJS.Worksheet): void => {
    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
        if (!column.values || !column.eachCell) return;

        let maxLength = 0;
        column.eachCell({ includeEmpty: false }, (cell) => {
            const cellValue = cell.value?.toString() || '';
            maxLength = Math.max(maxLength, cellValue.length);
        });

        // Set column width (with min and max limits)
        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });

    // Add filters to header row
    worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: worksheet.columnCount }
    };

    // Freeze header row
    worksheet.views = [
        { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
};

/**
 * Convert database object to Excel row
 * Opposite of excelRowToObject - prepares data for export
 */
export const objectToExcelRow = (obj: any): any => {
    const flattened = flattenObject(obj);
    const row: any = {};

    for (const [key, value] of Object.entries(flattened)) {
        if (value === null || value === undefined) {
            row[key] = '';
        } else if (value instanceof Date) {
            row[key] = formatDate(value);
        } else if (typeof value === 'boolean') {
            row[key] = value ? 'Yes' : 'No';
        } else {
            row[key] = value;
        }
    }

    return row;
};

/**
 * Create Excel worksheet with data
 */
export const createWorksheet = (
    workbook: ExcelJS.Workbook,
    sheetName: string,
    data: any[],
    columns?: Partial<ExcelJS.Column>[]
): ExcelJS.Worksheet => {
    const worksheet = workbook.addWorksheet(sheetName);

    if (columns) {
        worksheet.columns = columns;
    } else if (data.length > 0) {
        // Auto-generate columns from first row
        const firstRow = data[0];
        worksheet.columns = Object.keys(firstRow).map(key => ({
            header: key,
            key: key,
            width: 15
        }));
    }

    // Add data rows
    data.forEach(item => {
        worksheet.addRow(item);
    });

    // Apply styles
    applyExcelStyles(worksheet);

    return worksheet;
};

/**
 * Generate unique filename for export
 */
export const generateExportFilename = (entityName: string): string => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `${entityName}_export_${timestamp}.xlsx`;
};
